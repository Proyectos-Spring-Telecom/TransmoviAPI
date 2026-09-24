import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  EnumEstatusPago,
  EnumTipoPago,
  EnumTipoTransaccion,
} from 'src/common/estatus.enum';
import { CatMetodoPago } from 'src/entities/CatMetodoPago';
import { HistoricoTransaccionesRecarga } from 'src/entities/HistoricoTransaccionesRecarga';
import { Monederos } from 'src/entities/Monederos';
import { Pagos } from 'src/entities/Pagos';
import { TransaccionesRecarga } from 'src/entities/TransaccionesRecarga';
import { horaDesfasada } from 'src/utils/correccion-hora';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AcreditarPagoDto } from './dto/acreditar-pago.dto';
import { CreatePagoDto } from './dto/create-pago.dto';
import { CreatePagoTarjetaDto } from './dto/create-pago-tarjeta.dto';

@Injectable()
export class PagosService {
  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Pagos)
    private readonly pagosRepository: Repository<Pagos>,
  ) {}

  async crearPagoSpei(createPagoDto: CreatePagoDto, userName: string) {
    try {
      if (!userName) {
        throw new BadRequestException(
          'No fue posible obtener el usuario que solicita el pago.',
        );
      }

      const urlPagos = this.configService.get<string>('URL_PAGOS');
      if (!urlPagos) {
        throw new InternalServerErrorException(
          'No se encontró la URL del servicio de pagos.',
        );
      }

      const externalReference = this.generarExternalReference(
        createPagoDto.monedero,
      );
      const descripcion = `Recarga de saldo: ${createPagoDto.transaction_amount}`;
      const payload = {
        transaction_amount: createPagoDto.transaction_amount,
        monedero: createPagoDto.monedero,
        payer: {
          email: userName,
        },
        description: descripcion,
        external_reference: externalReference,
      };

      const { data } = await axios.post(urlPagos, payload, {
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      });

      const idsExternos = this.extraerIdsPagoExterno(data);
      const pago = await this.guardarPagoGenerado({
        monedero: createPagoDto.monedero,
        monto: createPagoDto.transaction_amount,
        tipoPago: EnumTipoPago.SPEI,
        externalReference,
        emailPayer: userName,
        descripcion,
        orderId: idsExternos.orderId,
        paymentId: idsExternos.paymentId,
        status: idsExternos.status,
        paymentStatus: idsExternos.status,
        paymentStatusDetail: idsExternos.statusDetail,
        estatus: EnumEstatusPago.NO_ACREDITADO,
      });

      return {
        status: 'success',
        message: 'Solicitud de pago enviada correctamente',
        data,
        pago: this.mapearPago(pago),
      };
    } catch (error) {
      console.error('[crearPagoSpei]', error);
      if (error instanceof HttpException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.response) {
          const remote = error.response.data;
          const message =
            typeof remote === 'string'
              ? remote
              : remote?.message ??
                remote?.error ??
                'Error al procesar el pago en el servicio externo.';

          throw new HttpException(
            Array.isArray(message) ? message.join(', ') : message,
            error.response.status,
          );
        }

        throw new BadRequestException(
          `No se pudo conectar con el servicio de pagos SPEI: ${error.message}`,
        );
      }

      throw new BadRequestException(
        `Se produjo un error al registrar el pago SPEI: ${error?.message ?? 'Error desconocido'}`,
      );
    }
  }

  async crearPagoTarjeta(createPagoTarjetaDto: CreatePagoTarjetaDto) {
    const urlPagosTarjeta = this.configService.get<string>('URL_PAGOS_TARJETA');
    if (!urlPagosTarjeta) {
      throw new InternalServerErrorException(
        'No se encontró la URL del checkout de pago con tarjeta.',
      );
    }

    const ref = this.generarExternalReference(createPagoTarjetaDto.monedero);
    const url = new URL(urlPagosTarjeta);
    url.searchParams.set('monedero', createPagoTarjetaDto.monedero);
    url.searchParams.set('amount', String(createPagoTarjetaDto.amount));
    url.searchParams.set('ref', ref);

    const pago = await this.pagosRepository.save(
      this.pagosRepository.create({
        monedero: createPagoTarjetaDto.monedero,
        monto: createPagoTarjetaDto.amount,
        tipoPago: EnumTipoPago.TARJETA,
        externalReference: ref,
        descripcion: `Recarga de saldo: ${createPagoTarjetaDto.amount}`,
        urlCheckout: url.toString(),
        estatus: EnumEstatusPago.NO_ACREDITADO,
      }),
    );

    return {
      status: 'success',
      message: 'URL de pago con tarjeta generada correctamente',
      data: {
        url: url.toString(),
        monedero: createPagoTarjetaDto.monedero,
        amount: createPagoTarjetaDto.amount,
        ref,
      },
      pago: this.mapearPago(pago),
    };
  }

  async acreditarPago(acreditarPagoDto: AcreditarPagoDto) {
    const esAcreditado =
      acreditarPagoDto.payment_status === 'processed' &&
      acreditarPagoDto.payment_status_detail === 'accredited';

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pagoRepo = queryRunner.manager.getRepository(Pagos);
      const pagoExistente = await this.buscarPagoRegistrado(
        pagoRepo,
        acreditarPagoDto,
      );
      const yaAcreditado =
        pagoExistente?.estatus === EnumEstatusPago.ACREDITADO;

      const pago = await this.guardarPagoDesdeWebhook(
        pagoRepo,
        pagoExistente,
        acreditarPagoDto,
        yaAcreditado || esAcreditado,
      );

      if (!esAcreditado) {
        await queryRunner.commitTransaction();
        return {
          status: 'received',
          message:
            'Aviso recibido. El pago no está acreditado; no se sumó saldo.',
          data: {
            acreditado: false,
            order_id: acreditarPagoDto.order_id,
            payment_id: acreditarPagoDto.payment_id,
            payment_status: acreditarPagoDto.payment_status,
            payment_status_detail: acreditarPagoDto.payment_status_detail,
            monedero: acreditarPagoDto.monedero,
            pago: this.mapearPago(pago),
          },
        };
      }

      if (yaAcreditado) {
        await queryRunner.commitTransaction();
        return {
          status: 'success',
          message: 'El pago ya había sido acreditado.',
          data: {
            acreditado: true,
            duplicado: true,
            order_id: acreditarPagoDto.order_id,
            payment_id: acreditarPagoDto.payment_id,
            monedero: acreditarPagoDto.monedero,
            monto: Number(pago.monto),
            pago: this.mapearPago(pago),
          },
        };
      }

      const resultadoRecarga = await this.acreditarSaldoMonedero(
        queryRunner.manager,
        acreditarPagoDto,
      );

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: 'Saldo acreditado correctamente',
        data: {
          acreditado: true,
          order_id: acreditarPagoDto.order_id,
          payment_id: acreditarPagoDto.payment_id,
          monedero: acreditarPagoDto.monedero,
          numeroSerieMonedero: resultadoRecarga.numeroSerieMonedero,
          monto: resultadoRecarga.montoRecarga,
          saldoAnterior: resultadoRecarga.saldoAnterior,
          saldoFinal: resultadoRecarga.saldoFinal,
          pago: this.mapearPago(pago),
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('[acreditarPago]', error?.message ?? error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Se produjo un error al acreditar el pago.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async acreditarSaldoMonedero(
    manager: EntityManager,
    acreditarPagoDto: AcreditarPagoDto,
  ) {
    const monederoRepo = manager.getRepository(Monederos);
    const transaccionesRecargaRepo = manager.getRepository(TransaccionesRecarga);
    const historicoRepo = manager.getRepository(HistoricoTransaccionesRecarga);

    const monedero = await monederoRepo.findOne({
      where: [
        { numeroSerie: acreditarPagoDto.monedero, estatus: 1 },
        { idCard: acreditarPagoDto.monedero, estatus: 1 },
      ],
    });

    if (!monedero) {
      throw new NotFoundException(
        `Monedero ${acreditarPagoDto.monedero} no encontrado o inactivo.`,
      );
    }

    const metodoPago = await this.resolverMetodoPago(manager);
    const { fechaActual } = await horaDesfasada();
    const saldoActual = Number(monedero.saldo);
    const montoRecarga = Number(acreditarPagoDto.total_amount);
    const montoFinal = Number((saldoActual + montoRecarga).toFixed(2));
    const contexto = `Pago acreditado ${acreditarPagoDto.payment_id}`.slice(
      0,
      100,
    );
    const controlTransaccion = acreditarPagoDto.payment_id.slice(0, 30);

    const transaccionSave = await transaccionesRecargaRepo.save(
      transaccionesRecargaRepo.create({
        idTipoTransaccion: EnumTipoTransaccion.RECARGA,
        controlTransaccion,
        monto: montoRecarga,
        idMetodoPago: metodoPago.id,
        fechaHoraFinal: fechaActual,
        numeroSerieMonedero: monedero.numeroSerie,
        numeroSerieDispositivo: null,
        idUsuario: null,
        contexto,
      }),
    );

    await monederoRepo.update({ id: monedero.id }, { saldo: montoFinal });

    await historicoRepo.save(
      historicoRepo.create({
        idTipoTransaccion: transaccionSave.idTipoTransaccion,
        controlTransaccion: transaccionSave.controlTransaccion,
        monto: transaccionSave.monto,
        idMetodoPago: transaccionSave.idMetodoPago,
        fechaHoraFinal: transaccionSave.fechaHoraFinal,
        fhRegistro: transaccionSave.fhRegistro,
        numeroSerieMonedero: transaccionSave.numeroSerieMonedero,
        numeroSerieDispositivo: null,
        idUsuario: null,
        contexto,
      }),
    );

    return {
      numeroSerieMonedero: monedero.numeroSerie,
      montoRecarga,
      saldoAnterior: saldoActual,
      saldoFinal: montoFinal,
    };
  }

  private async buscarPagoRegistrado(
    pagoRepo: Repository<Pagos>,
    dto: AcreditarPagoDto,
  ) {
    if (dto.payment_id) {
      const porPaymentId = await pagoRepo.findOne({
        where: { paymentId: dto.payment_id },
      });
      if (porPaymentId) {
        return porPaymentId;
      }
    }

    if (dto.order_id) {
      const porOrderId = await pagoRepo.findOne({
        where: { orderId: dto.order_id },
      });
      if (porOrderId) {
        return porOrderId;
      }
    }

    if (dto.external_reference) {
      const porReferencia = await pagoRepo.findOne({
        where: { externalReference: dto.external_reference },
      });
      if (porReferencia) {
        return porReferencia;
      }
    }

    const pendientes = await pagoRepo.find({
      where: {
        monedero: dto.monedero,
        estatus: EnumEstatusPago.NO_ACREDITADO,
      },
      order: { id: 'DESC' },
      take: 20,
    });

    const porRefParcial = pendientes.find(
      (pago) =>
        !!dto.external_reference &&
        !!pago.externalReference &&
        (dto.external_reference.includes(pago.externalReference) ||
          pago.externalReference.includes(dto.external_reference)),
    );
    if (porRefParcial) {
      return porRefParcial;
    }

    return (
      pendientes.find(
        (pago) => Number(pago.monto) === Number(dto.total_amount),
      ) ?? null
    );
  }

  private async guardarPagoDesdeWebhook(
    pagoRepo: Repository<Pagos>,
    pagoExistente: Pagos | null,
    dto: AcreditarPagoDto,
    acreditado: boolean,
  ): Promise<Pagos> {
    const datosWebhook: Partial<Pagos> = {
      monedero: dto.monedero,
      monto: dto.total_amount,
      externalReference:
        dto.external_reference ?? pagoExistente?.externalReference ?? null,
      orderId: dto.order_id,
      paymentId: dto.payment_id,
      status: dto.status,
      paymentStatus: dto.payment_status,
      paymentStatusDetail: dto.payment_status_detail,
      estatus: acreditado
        ? EnumEstatusPago.ACREDITADO
        : EnumEstatusPago.NO_ACREDITADO,
      fechaActualizacion: new Date(),
    };

    if (pagoExistente) {
      await pagoRepo.update({ id: pagoExistente.id }, datosWebhook);
      const pagoActualizado = await pagoRepo.findOne({
        where: { id: pagoExistente.id },
      });
      if (!pagoActualizado) {
        throw new InternalServerErrorException(
          'No fue posible actualizar el registro de pago.',
        );
      }
      return pagoActualizado;
    }

    return pagoRepo.save(
      pagoRepo.create({
        ...datosWebhook,
        tipoPago: null,
        descripcion: `Recarga de saldo: ${dto.total_amount}`,
      }),
    );
  }

  private async guardarPagoGenerado(datos: Partial<Pagos>): Promise<Pagos> {
    const filtros: Array<Pick<Pagos, 'paymentId'> | Pick<Pagos, 'orderId'>> = [];
    if (datos.paymentId) {
      filtros.push({ paymentId: datos.paymentId });
    }
    if (datos.orderId) {
      filtros.push({ orderId: datos.orderId });
    }

    const existente = filtros.length
      ? await this.pagosRepository.findOne({ where: filtros })
      : null;

    if (existente) {
      await this.pagosRepository.update(
        { id: existente.id },
        { ...datos, fechaActualizacion: new Date() },
      );
      const actualizado = await this.pagosRepository.findOne({
        where: { id: existente.id },
      });
      if (!actualizado) {
        throw new InternalServerErrorException(
          'No fue posible actualizar el registro de pago.',
        );
      }
      return actualizado;
    }

    try {
      return await this.pagosRepository.save(
        this.pagosRepository.create(datos),
      );
    } catch (error) {
      if (!this.esDuplicado(error) || filtros.length === 0) {
        throw error;
      }

      const duplicado = await this.pagosRepository.findOne({ where: filtros });
      if (!duplicado) {
        throw error;
      }

      await this.pagosRepository.update(
        { id: duplicado.id },
        { ...datos, fechaActualizacion: new Date() },
      );
      const actualizado = await this.pagosRepository.findOne({
        where: { id: duplicado.id },
      });
      if (!actualizado) {
        throw error;
      }
      return actualizado;
    }
  }

  private esDuplicado(error: any): boolean {
    const codigo = error?.code ?? error?.driverError?.code;
    const mensaje = String(error?.message ?? error?.driverError?.message ?? '');
    return codigo === 'ER_DUP_ENTRY' || /duplicate/i.test(mensaje);
  }

  private extraerIdsPagoExterno(data: any) {
    const orderId = data?.order_id ?? data?.orderId ?? null;
    const paymentId =
      data?.payment_id ?? data?.paymentId ?? data?.payment?.id ?? null;

    return {
      orderId: orderId != null ? String(orderId) : null,
      paymentId: paymentId != null ? String(paymentId) : null,
      status: data?.status != null ? String(data.status) : null,
      statusDetail:
        data?.status_detail != null ? String(data.status_detail) : null,
    };
  }

  private mapearPago(pago: Pagos) {
    return {
      id: Number(pago.id),
      monedero: pago.monedero,
      monto: Number(pago.monto),
      tipoPago: pago.tipoPago,
      externalReference: pago.externalReference,
      orderId: pago.orderId,
      paymentId: pago.paymentId,
      status: pago.status,
      paymentStatus: pago.paymentStatus,
      paymentStatusDetail: pago.paymentStatusDetail,
      estatus: Number(pago.estatus),
      acreditado: Number(pago.estatus) === EnumEstatusPago.ACREDITADO,
    };
  }

  private async resolverMetodoPago(manager: EntityManager) {
    const metodos = await manager.getRepository(CatMetodoPago).find();
    if (metodos.length === 0) {
      throw new BadRequestException(
        'No hay métodos de pago configurados para acreditar la recarga.',
      );
    }

    const metodo =
      metodos.find((item) =>
        /spei|transferencia|mercado\s*pago|tarjeta/i.test(item.nombre),
      ) ?? metodos[0];

    return metodo;
  }

  private generarExternalReference(monedero: string): string {
    const fecha = this.obtenerFechaYyMmDd();
    const digitos = (monedero.match(/\d/g) ?? []).join('');
    const ultimosTres = digitos.slice(-3).padStart(3, '0');
    return `${fecha}-${ultimosTres}`;
  }

  private obtenerFechaYyMmDd(): string {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Mexico_City',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const yy = parts.find((part) => part.type === 'year')?.value ?? '';
    const mm = parts.find((part) => part.type === 'month')?.value ?? '';
    const dd = parts.find((part) => part.type === 'day')?.value ?? '';
    return `${yy}${mm}${dd}`;
  }
}
