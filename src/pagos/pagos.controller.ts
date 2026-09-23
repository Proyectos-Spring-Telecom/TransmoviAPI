import {
  Body,
  Controller,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { AcreditarPagoDto } from './dto/acreditar-pago.dto';
import { CreatePagoDto } from './dto/create-pago.dto';
import { CreatePagoTarjetaDto } from './dto/create-pago-tarjeta.dto';
import { PagosService } from './pagos.service';

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @ApiBearerAuth('bearer-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generar pago SPEI',
    description:
      'Solicita un pago SPEI al servicio de Mercado Pago. El correo del pagador se toma del usuario autenticado.',
  })
  @ApiBody({
    type: CreatePagoDto,
    description: 'Monto de la recarga e identificador del monedero',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud de pago enviada correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string' },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o del servicio de pagos',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  crearPago(@Body() createPagoDto: CreatePagoDto, @Request() req) {
    const userName = req.user.email;
    return this.pagosService.crearPagoSpei(createPagoDto, userName);
  }

  @Post('tarjeta')
  @ApiBearerAuth('bearer-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generar URL de pago con tarjeta',
    description:
      'Arma la URL de checkout de Mercado Pago con monedero, amount y ref.',
  })
  @ApiBody({
    type: CreatePagoTarjetaDto,
    description: 'Monto de la recarga e identificador del monedero',
  })
  @ApiResponse({
    status: 201,
    description: 'URL de checkout generada correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example:
                'https://qmt.mx/api-mercadopago/checkout.html?monedero=MXN-ABC123&amount=500&ref=260923-123',
            },
            monedero: { type: 'string', example: 'MXN-ABC123' },
            amount: { type: 'number', example: 500 },
            ref: { type: 'string', example: '260923-123' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  crearPagoTarjeta(@Body() createPagoTarjetaDto: CreatePagoTarjetaDto) {
    return this.pagosService.crearPagoTarjeta(createPagoTarjetaDto);
  }

  @Post('acreditar')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook para acreditar saldo',
    description:
      'Recibe avisos del servicio de pagos. Solo suma saldo si payment_status es processed y payment_status_detail es accredited. El monedero se busca por el campo monedero.',
  })
  @ApiBody({
    type: AcreditarPagoDto,
    description: 'Notificación de estatus del pago',
  })
  @ApiResponse({
    status: 200,
    description: 'Aviso procesado',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            acreditado: { type: 'boolean', example: true },
            monedero: { type: 'string', example: 'MXN-ABC123' },
            monto: { type: 'number', example: 150.5 },
            saldoFinal: { type: 'number', example: 350.5 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Error de validación' })
  @ApiResponse({ status: 404, description: 'Monedero no encontrado' })
  acreditarPago(@Body() acreditarPagoDto: AcreditarPagoDto) {
    return this.pagosService.acreditarPago(acreditarPagoDto);
  }
}
