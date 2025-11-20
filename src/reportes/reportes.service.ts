import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clientes } from 'src/entities/Clientes';
import { RecaudacionDiariaRutaDto } from './dto/recaudacion-diaria-ruta.dto';
import { RecaudacionPorOperadorDto } from './dto/recaudacion-por-operador.dto';
import { ApiResponseCommon } from 'src/common/ApiResponse';

@Injectable()
export class ReportesService {
  constructor(
    @InjectRepository(Clientes)
    private readonly clienteRepository: Repository<Clientes>,
  ) {}

  private async clienteHijos(cliente: number) {
    const clientesFiltrado = await this.clienteRepository.query(
      `CALL spGetClientes(?);`,
      [cliente],
    );

    const idsFiltrados = clientesFiltrado[0];
    const ids = idsFiltrados
      .map((clientesFiltrado: any) => Number(clientesFiltrado.Id))
      .filter(Boolean);
    if (ids.length === 0) {
      return { ids: [], placeholders: '' };
    }

    const placeholders = ids.map(() => '?').join(', ');
    return { ids, placeholders };
  }

  async recaudacionDiariaPorRuta(
    filtros: RecaudacionDiariaRutaDto,
    cliente: number,
  ): Promise<ApiResponseCommon> {
    try {
      // Obtener jerarquía de clientes
      const { ids: clienteIds, placeholders } = await this.clienteHijos(cliente);
      
      if (clienteIds.length === 0) {
        return {
          data: [],
        };
      }

      // Construir condiciones WHERE dinámicas
      const condiciones: string[] = [];
      const parametros: any[] = [];

      // Filtro de clientes
      condiciones.push(`c.Id IN (${placeholders})`);
      parametros.push(...clienteIds);

      // Filtro de fecha
      if (filtros.fechaInicio) {
        // Convertir fecha ISO a formato MySQL y usar solo la fecha
        const fechaInicio = filtros.fechaInicio.split('T')[0];
        condiciones.push(`DATE(v.Inicio) >= ?`);
        parametros.push(fechaInicio);
      }
      if (filtros.fechaFin) {
        // Convertir fecha ISO a formato MySQL y usar solo la fecha
        const fechaFin = filtros.fechaFin.split('T')[0];
        condiciones.push(`DATE(v.Inicio) <= ?`);
        parametros.push(fechaFin);
      }

      // Filtro de región
      if (filtros.idRegion) {
        condiciones.push(`reg.Id = ?`);
        parametros.push(filtros.idRegion);
      }

      // Filtro de ruta
      if (filtros.idRuta) {
        condiciones.push(`r.Id = ?`);
        parametros.push(filtros.idRuta);
      }

      // Filtro de derrotero
      if (filtros.idDerrotero) {
        condiciones.push(`d.Id = ?`);
        parametros.push(filtros.idDerrotero);
      }

      const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

      // Ya no necesitamos la segunda subconsulta, usamos una sola consulta con LEFT JOINs

      // Construir condiciones para transacciones (sin depender de viajes)
      const condicionesTransacciones: string[] = [];
      const parametrosTransacciones: any[] = [];

      // Filtro de clientes a través de Monederos
      condicionesTransacciones.push(`m.IdCliente IN (${placeholders})`);
      parametrosTransacciones.push(...clienteIds);

      // Filtro de fecha para transacciones
      if (filtros.fechaInicio) {
        const fechaInicio = filtros.fechaInicio.split('T')[0];
        condicionesTransacciones.push(`DATE(td.FechaHora) >= ?`);
        parametrosTransacciones.push(fechaInicio);
      }
      if (filtros.fechaFin) {
        const fechaFin = filtros.fechaFin.split('T')[0];
        condicionesTransacciones.push(`DATE(td.FechaHora) <= ?`);
        parametrosTransacciones.push(fechaFin);
      }

      const whereClauseTransacciones = condicionesTransacciones.length > 0 ? `WHERE ${condicionesTransacciones.join(' AND ')}` : '';

      const query = `
SELECT
    COALESCE(DATE(v.Inicio), DATE(td.FechaHora)) AS fecha,
    reg.Id AS idRegion,
    reg.Nombre AS nombreRegion,
    r.Id AS idRuta,
    r.Nombre AS nombreRuta,
    d.Id AS idDerrotero,
    d.Nombre AS nombreDerrotero,
    COUNT(DISTINCT v.Id) AS viajes,
    COUNT(DISTINCT td.Id) AS validaciones,
    COALESCE(SUM(td.Monto), 0) AS ingresos,
    CASE 
        WHEN COUNT(DISTINCT td.Id) > 0 
        THEN COALESCE(SUM(td.Monto), 0) / COUNT(DISTINCT td.Id)
        ELSE 0 
    END AS ticketPromedio,
    CASE 
        WHEN COUNT(DISTINCT td.Id) > 0
        THEN (COUNT(DISTINCT CASE WHEN td.ControlTransaccion = 1 THEN td.Id END) * 100.0) / COUNT(DISTINCT td.Id)
        ELSE 0
    END AS porcentajeElectronico,
    COALESCE(SUM(vc.Diferencia), 0) AS pasajerosContados,
    COALESCE(SUM(vc.Diferencia), 0) - COUNT(DISTINCT td.Id) AS evasionAbsoluta,
    CASE 
        WHEN COALESCE(SUM(vc.Diferencia), 0) > 0
        THEN ((COALESCE(SUM(vc.Diferencia), 0) - COUNT(DISTINCT td.Id)) * 100.0) / COALESCE(SUM(vc.Diferencia), 0)
        ELSE 0
    END AS evasionPorcentual
FROM TransaccionesDebito td
INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
INNER JOIN Clientes c ON m.IdCliente = c.Id
LEFT JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
LEFT JOIN Viajes v ON vt.IdViaje = v.Id
LEFT JOIN Derroteros d ON v.IdDerrotero = d.Id
LEFT JOIN Rutas r ON d.IdRuta = r.Id
LEFT JOIN Regiones reg ON r.IdRegion = reg.Id
LEFT JOIN ViajesConteos vc_rel ON vc_rel.IdViaje = v.Id
LEFT JOIN ConteoPasajeros vc ON vc_rel.IdConteo = vc.Id
${whereClauseTransacciones}
GROUP BY COALESCE(DATE(v.Inicio), DATE(td.FechaHora)), reg.Id, reg.Nombre, r.Id, r.Nombre, d.Id, d.Nombre
ORDER BY COALESCE(DATE(v.Inicio), DATE(td.FechaHora)) DESC, reg.Nombre, r.Nombre, d.Nombre;
      `;

      // Log temporal para debugging (remover en producción)
      console.log('=== DEBUG REPORTE RECAUDACIÓN ===');
      console.log('Filtros recibidos:', filtros);
      console.log('Cliente IDs:', clienteIds);
      console.log('Where clause transacciones:', whereClauseTransacciones);
      console.log('Parámetros transacciones:', parametrosTransacciones);
      console.log('Cantidad de placeholders en query:', (query.match(/\?/g) || []).length);
      console.log('Cantidad de parámetros:', parametrosTransacciones.length);

      // Consulta de prueba para verificar que hay viajes
      const queryTest = `
        SELECT COUNT(*) as totalViajes
        FROM Viajes v
        INNER JOIN Clientes c ON v.IdCliente = c.Id
        WHERE c.Id IN (${placeholders})
        ${filtros.fechaInicio ? `AND DATE(v.Inicio) >= ?` : ''}
        ${filtros.fechaFin ? `AND DATE(v.Inicio) <= ?` : ''}
      `;
      const paramsTest = [
        ...clienteIds,
        ...(filtros.fechaInicio ? [filtros.fechaInicio.split('T')[0]] : []),
        ...(filtros.fechaFin ? [filtros.fechaFin.split('T')[0]] : []),
      ];
      const testResult = await this.clienteRepository.query(queryTest, paramsTest);
      const totalViajes = testResult[0]?.totalViajes || 0;
      console.log('Total de viajes que cumplen filtros básicos:', totalViajes);
      
      if (totalViajes === 0) {
        console.warn('⚠️ ADVERTENCIA: No se encontraron viajes en el rango de fechas especificado.');
        console.warn('El reporte de recaudación diaria por ruta requiere viajes para obtener información de rutas y derroteros.');
        console.warn('Por favor, asegúrese de que existan viajes en el rango de fechas especificado.');
      }

      // Verificar si hay transacciones relacionadas con viajes
      const queryTestTransacciones = `
        SELECT COUNT(DISTINCT v.Id) as viajesConTransacciones
        FROM Viajes v
        INNER JOIN Clientes c ON v.IdCliente = c.Id
        INNER JOIN ViajesTransacciones vt ON vt.IdViaje = v.Id
        INNER JOIN TransaccionesDebito td ON vt.IdTransaccionDebito = td.Id
        WHERE c.Id IN (${placeholders})
        ${filtros.fechaInicio ? `AND DATE(v.Inicio) >= ?` : ''}
        ${filtros.fechaFin ? `AND DATE(v.Inicio) <= ?` : ''}
      `;
      const testTransacciones = await this.clienteRepository.query(queryTestTransacciones, paramsTest);
      console.log('Viajes con transacciones relacionadas:', testTransacciones[0]?.viajesConTransacciones || 0);

      // Verificar estructura de ViajesTransacciones
      const queryTestVT = `
        SELECT COUNT(*) as totalRelaciones
        FROM ViajesTransacciones vt
        INNER JOIN Viajes v ON vt.IdViaje = v.Id
        INNER JOIN Clientes c ON v.IdCliente = c.Id
        WHERE c.Id IN (${placeholders})
        ${filtros.fechaInicio ? `AND DATE(v.Inicio) >= ?` : ''}
        ${filtros.fechaFin ? `AND DATE(v.Inicio) <= ?` : ''}
      `;
      const testVT = await this.clienteRepository.query(queryTestVT, paramsTest);
      console.log('Total relaciones ViajesTransacciones:', testVT[0]?.totalRelaciones || 0);
      
      // Verificar columnas de ViajesTransacciones
      const queryColumns = `
        SHOW COLUMNS FROM ViajesTransacciones
      `;
      const columns = await this.clienteRepository.query(queryColumns);
      console.log('Columnas de ViajesTransacciones:', columns.map((c: any) => c.Field));

      // Verificar si hay viajes en ese rango SIN filtrar por cliente
      const queryTestSinCliente = `
        SELECT COUNT(*) as totalViajesSinCliente
        FROM Viajes v
        WHERE DATE(v.Inicio) >= ? AND DATE(v.Inicio) <= ?
      `;
      const paramsTestSinCliente = [
        filtros.fechaInicio ? filtros.fechaInicio.split('T')[0] : null,
        filtros.fechaFin ? filtros.fechaFin.split('T')[0] : null,
      ].filter(Boolean);
      if (paramsTestSinCliente.length === 2) {
        const testSinCliente = await this.clienteRepository.query(queryTestSinCliente, paramsTestSinCliente);
        console.log('Total de viajes en rango (sin filtro cliente):', testSinCliente[0]?.totalViajesSinCliente || 0);
      }

      // Verificar transacciones en ese rango
      const queryTestTransaccionesRango = `
        SELECT COUNT(*) as totalTransacciones
        FROM TransaccionesDebito td
        WHERE DATE(td.FechaHora) >= ? AND DATE(td.FechaHora) <= ?
      `;
      const testTransaccionesRango = await this.clienteRepository.query(queryTestTransaccionesRango, [
        filtros.fechaInicio ? filtros.fechaInicio.split('T')[0] : null,
        filtros.fechaFin ? filtros.fechaFin.split('T')[0] : null,
      ].filter(Boolean));
      console.log('Total transacciones en rango:', testTransaccionesRango[0]?.totalTransacciones || 0);

      // Verificar si las transacciones tienen viajes asociados
      const queryTestTransaccionesConViajes = `
        SELECT COUNT(*) as transaccionesConViajes
        FROM TransaccionesDebito td
        INNER JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
        INNER JOIN Viajes v ON vt.IdViaje = v.Id
        WHERE DATE(td.FechaHora) >= ? AND DATE(td.FechaHora) <= ?
      `;
      const testTransaccionesConViajes = await this.clienteRepository.query(queryTestTransaccionesConViajes, [
        filtros.fechaInicio ? filtros.fechaInicio.split('T')[0] : null,
        filtros.fechaFin ? filtros.fechaFin.split('T')[0] : null,
      ].filter(Boolean));
      console.log('Transacciones con viajes asociados:', testTransaccionesConViajes[0]?.transaccionesConViajes || 0);

      const resultados = await this.clienteRepository.query(query, parametrosTransacciones);
      
      console.log('Resultados obtenidos del reporte:', resultados.length);
      console.log('Primeros 3 resultados:', resultados.slice(0, 3));
      console.log('=== FIN DEBUG ===');

      // Formatear resultados
      const data = resultados.map((row: any) => ({
        fecha: row.fecha || null,
        idRegion: row.idRegion ? Number(row.idRegion) : null,
        nombreRegion: row.nombreRegion || null,
        idRuta: row.idRuta ? Number(row.idRuta) : null,
        nombreRuta: row.nombreRuta || null,
        idDerrotero: row.idDerrotero ? Number(row.idDerrotero) : null,
        nombreDerrotero: row.nombreDerrotero || null,
        viajes: row.viajes ? Number(row.viajes) : 0,
        validaciones: row.validaciones ? Number(row.validaciones) : 0,
        ingresos: row.ingresos ? Number(parseFloat(String(row.ingresos)).toFixed(2)) : 0,
        ticketPromedio: row.ticketPromedio ? Number(parseFloat(String(row.ticketPromedio)).toFixed(2)) : 0,
        porcentajeElectronico: row.porcentajeElectronico ? Number(parseFloat(String(row.porcentajeElectronico)).toFixed(2)) : 0,
        pasajerosContados: row.pasajerosContados ? Number(row.pasajerosContados) : 0,
        evasionAbsoluta: row.evasionAbsoluta !== null && row.evasionAbsoluta !== undefined ? Number(row.evasionAbsoluta) : 0,
        evasionPorcentual: row.evasionPorcentual ? Number(parseFloat(String(row.evasionPorcentual)).toFixed(2)) : 0,
      }));

      return {
        data,
      };
    } catch (error) {
      console.error('Error en recaudacionDiariaPorRuta:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error al generar el reporte de recaudación diaria por ruta',
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async recaudacionPorOperador(
    filtros: RecaudacionPorOperadorDto,
    cliente: number,
  ): Promise<ApiResponseCommon> {
    try {
      // Obtener jerarquía de clientes
      const { ids: clienteIds, placeholders } = await this.clienteHijos(cliente);
      
      if (clienteIds.length === 0) {
        return {
          data: [],
        };
      }

      // Preparar filtros de fecha
      const fechaInicio = filtros.fechaInicio ? filtros.fechaInicio.split('T')[0] : null;
      const fechaFin = filtros.fechaFin ? filtros.fechaFin.split('T')[0] : null;

      // Construir condiciones de fecha para subconsultas
      const condicionesFechaTurnos: string[] = [];
      const condicionesFechaViajes: string[] = [];
      
      if (fechaInicio) {
        condicionesFechaTurnos.push(`DATE(t.Inicio) >= ?`);
        condicionesFechaViajes.push(`DATE(v2.Inicio) >= ?`); // Usar v2 porque es el alias en la subconsulta
      }
      if (fechaFin) {
        condicionesFechaTurnos.push(`DATE(t.Inicio) <= ?`);
        condicionesFechaViajes.push(`DATE(v2.Inicio) <= ?`); // Usar v2 porque es el alias en la subconsulta
      }

      const fechaTurnosWhere = condicionesFechaTurnos.length > 0 ? `AND ${condicionesFechaTurnos.join(' AND ')}` : '';
      const fechaViajesWhere = condicionesFechaViajes.length > 0 ? `AND ${condicionesFechaViajes.join(' AND ')}` : '';

      // Consulta simplificada: empezar desde transacciones y agrupar por operador (o NULL)
      // Usamos subconsultas separadas para evitar problemas con GROUP BY
      const query = `
SELECT
    datos.idOperador,
    datos.operador,
    datos.licencia,
    COALESCE(turnos_data.totalTurnos, 0) AS turnos,
    COALESCE(viajes_data.totalViajes, 0) AS viajes,
    datos.validaciones,
    datos.ingresos,
    datos.ticketPromedio,
    datos.evasionPorcentual,
    turnos_data.ultimoTurno AS ultimoTurno
FROM (
    SELECT
        COALESCE(o.Id, 0) AS idOperador,
        COALESCE(
            CONCAT(
                u.Nombre,
                ' ',
                u.ApellidoPaterno,
                IFNULL(CONCAT(' ', u.ApellidoMaterno), '')
            ),
            'Sin operador asignado'
        ) AS operador,
        GROUP_CONCAT(DISTINCT l.NumeroLicencia SEPARATOR ', ') AS licencia,
        COUNT(DISTINCT td.Id) AS validaciones,
        COALESCE(SUM(td.Monto), 0) AS ingresos,
        CASE 
            WHEN COUNT(DISTINCT td.Id) > 0 
            THEN COALESCE(SUM(td.Monto), 0) / COUNT(DISTINCT td.Id)
            ELSE 0 
        END AS ticketPromedio,
        CASE 
            WHEN COALESCE(SUM(vc.Diferencia), 0) > 0
            THEN ((COALESCE(SUM(vc.Diferencia), 0) - COUNT(DISTINCT td.Id)) * 100.0) / COALESCE(SUM(vc.Diferencia), 0)
            ELSE 0
        END AS evasionPorcentual
    FROM TransaccionesDebito td
    INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
    INNER JOIN Clientes c ON m.IdCliente = c.Id
    LEFT JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
    LEFT JOIN Viajes v ON vt.IdViaje = v.Id
    LEFT JOIN Operadores o ON v.IdOperador = o.Id
    LEFT JOIN Usuarios u ON o.IdUsuario = u.Id
    LEFT JOIN Licencias l ON l.IdOperador = o.Id
    LEFT JOIN ViajesConteos vc_rel ON vc_rel.IdViaje = v.Id
    LEFT JOIN ConteoPasajeros vc ON vc_rel.IdConteo = vc.Id
    WHERE c.Id IN (${placeholders})
    ${fechaInicio ? `AND DATE(td.FechaHora) >= ?` : ''}
    ${fechaFin ? `AND DATE(td.FechaHora) <= ?` : ''}
    ${filtros.idOperador ? 'AND (o.Id = ? OR o.Id IS NULL)' : ''}
    GROUP BY COALESCE(o.Id, 0), u.Nombre, u.ApellidoPaterno, u.ApellidoMaterno
) AS datos
LEFT JOIN (
    SELECT 
        COALESCE(t.IdOperador, 0) AS IdOperador,
        COUNT(DISTINCT t.Id) AS totalTurnos,
        MAX(t.Inicio) AS ultimoTurno
    FROM Turnos t
    WHERE 1=1 ${fechaTurnosWhere}
    GROUP BY COALESCE(t.IdOperador, 0)
) AS turnos_data ON turnos_data.IdOperador = datos.idOperador
LEFT JOIN (
    SELECT 
        COALESCE(v2.IdOperador, 0) AS IdOperador,
        COUNT(DISTINCT v2.Id) AS totalViajes
    FROM Viajes v2
    WHERE 1=1 ${fechaViajesWhere}
    GROUP BY COALESCE(v2.IdOperador, 0)
) AS viajes_data ON viajes_data.IdOperador = datos.idOperador
ORDER BY datos.ingresos DESC, datos.operador ASC;
      `;

      // Construir parámetros para la consulta principal
      // Orden: clienteIds, fechas WHERE principal, idOperador, fechas subconsultas (turnos y viajes)
      const parametrosCompletos = [...clienteIds];
      
      // Parámetros de fecha para el WHERE principal (transacciones)
      if (fechaInicio) {
        parametrosCompletos.push(fechaInicio);
      }
      if (fechaFin) {
        parametrosCompletos.push(fechaFin);
      }
      
      // Parámetro de operador si existe
      if (filtros.idOperador) {
        parametrosCompletos.push(filtros.idOperador);
      }
      
      // Parámetros de fecha para las subconsultas de turnos (primero)
      if (fechaInicio) {
        parametrosCompletos.push(fechaInicio);
      }
      if (fechaFin) {
        parametrosCompletos.push(fechaFin);
      }
      
      // Parámetros de fecha para las subconsultas de viajes (después)
      if (fechaInicio) {
        parametrosCompletos.push(fechaInicio);
      }
      if (fechaFin) {
        parametrosCompletos.push(fechaFin);
      }

      console.log('=== DEBUG RECAUDACIÓN POR OPERADOR ===');
      console.log('Filtros:', filtros);
      console.log('Cliente IDs:', clienteIds);
      console.log('Parámetros completos:', parametrosCompletos);
      console.log('Cantidad de placeholders en query:', (query.match(/\?/g) || []).length);
      console.log('Cantidad de parámetros:', parametrosCompletos.length);
      
      // Consulta de prueba para verificar transacciones
      const queryTestTransacciones = `
        SELECT COUNT(*) as totalTransacciones
        FROM TransaccionesDebito td
        INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
        INNER JOIN Clientes c ON m.IdCliente = c.Id
        WHERE c.Id IN (${placeholders})
        ${fechaInicio ? `AND DATE(td.FechaHora) >= ?` : ''}
        ${fechaFin ? `AND DATE(td.FechaHora) <= ?` : ''}
      `;
      const paramsTestTransacciones = [
        ...clienteIds,
        ...(fechaInicio ? [fechaInicio] : []),
        ...(fechaFin ? [fechaFin] : []),
      ];
      const testTransacciones = await this.clienteRepository.query(queryTestTransacciones, paramsTestTransacciones);
      console.log('Total transacciones que cumplen filtros:', testTransacciones[0]?.totalTransacciones || 0);

      // Consulta de prueba para verificar transacciones con operadores
      const queryTestConOperadores = `
        SELECT COUNT(DISTINCT COALESCE(o.Id, 0)) as operadoresConTransacciones
        FROM TransaccionesDebito td
        INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
        INNER JOIN Clientes c ON m.IdCliente = c.Id
        LEFT JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
        LEFT JOIN Viajes v ON vt.IdViaje = v.Id
        LEFT JOIN Operadores o ON v.IdOperador = o.Id
        WHERE c.Id IN (${placeholders})
        ${fechaInicio ? `AND DATE(td.FechaHora) >= ?` : ''}
        ${fechaFin ? `AND DATE(td.FechaHora) <= ?` : ''}
      `;
      const testConOperadores = await this.clienteRepository.query(queryTestConOperadores, paramsTestTransacciones);
      console.log('Operadores distintos con transacciones:', testConOperadores[0]?.operadoresConTransacciones || 0);

      // Consulta de prueba simplificada para ver qué está pasando
      const queryTestSimple = `
        SELECT 
          COALESCE(o.Id, 0) AS idOperador,
          COUNT(DISTINCT td.Id) AS validaciones,
          COALESCE(SUM(td.Monto), 0) AS ingresos
        FROM TransaccionesDebito td
        INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
        INNER JOIN Clientes c ON m.IdCliente = c.Id
        LEFT JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
        LEFT JOIN Viajes v ON vt.IdViaje = v.Id
        LEFT JOIN Operadores o ON v.IdOperador = o.Id
        WHERE c.Id IN (${placeholders})
        ${fechaInicio ? `AND DATE(td.FechaHora) >= ?` : ''}
        ${fechaFin ? `AND DATE(td.FechaHora) <= ?` : ''}
        GROUP BY COALESCE(o.Id, 0)
      `;
      const testSimple = await this.clienteRepository.query(queryTestSimple, paramsTestTransacciones);
      console.log('Consulta simplificada - resultados:', testSimple.length);
      console.log('Datos de consulta simplificada:', JSON.stringify(testSimple, null, 2));
      
      // Verificar si el problema está en las subconsultas
      const queryTestSubconsultas = `
        SELECT 
          t.IdOperador,
          COUNT(DISTINCT t.Id) AS totalTurnos
        FROM Turnos t
        WHERE 1=1 ${fechaTurnosWhere}
        GROUP BY t.IdOperador
      `;
      const paramsSubconsultas: any[] = [];
      if (fechaInicio) paramsSubconsultas.push(fechaInicio);
      if (fechaFin) paramsSubconsultas.push(fechaFin);
      const testSubconsultas = await this.clienteRepository.query(queryTestSubconsultas, paramsSubconsultas);
      console.log('Subconsulta turnos - resultados:', testSubconsultas.length);

      // Consulta de prueba sin subconsultas para verificar
      const queryTestSinSubconsultas = `
        SELECT
          COALESCE(o.Id, 0) AS idOperador,
          COALESCE(
              CONCAT(
                  u.Nombre,
                  ' ',
                  u.ApellidoPaterno,
                  IFNULL(CONCAT(' ', u.ApellidoMaterno), '')
              ),
              'Sin operador asignado'
          ) AS operador,
          COUNT(DISTINCT td.Id) AS validaciones,
          COALESCE(SUM(td.Monto), 0) AS ingresos
        FROM TransaccionesDebito td
        INNER JOIN Monederos m ON td.NumeroSerieMonedero = m.NumeroSerie
        INNER JOIN Clientes c ON m.IdCliente = c.Id
        LEFT JOIN ViajesTransacciones vt ON vt.IdTransaccionDebito = td.Id
        LEFT JOIN Viajes v ON vt.IdViaje = v.Id
        LEFT JOIN Operadores o ON v.IdOperador = o.Id
        LEFT JOIN Usuarios u ON o.IdUsuario = u.Id
        WHERE c.Id IN (${placeholders})
        ${fechaInicio ? `AND DATE(td.FechaHora) >= ?` : ''}
        ${fechaFin ? `AND DATE(td.FechaHora) <= ?` : ''}
        GROUP BY COALESCE(o.Id, 0), u.Nombre, u.ApellidoPaterno, u.ApellidoMaterno
      `;
      const paramsTestSinSubconsultas = [
        ...clienteIds,
        ...(fechaInicio ? [fechaInicio] : []),
        ...(fechaFin ? [fechaFin] : []),
      ];
      const testSinSubconsultas = await this.clienteRepository.query(queryTestSinSubconsultas, paramsTestSinSubconsultas);
      console.log('Consulta sin subconsultas - resultados:', testSinSubconsultas.length);
      console.log('Datos sin subconsultas:', JSON.stringify(testSinSubconsultas, null, 2));

      console.log('Ejecutando consulta principal...');
      console.log('Query completa (primeros 1000 chars):', query.substring(0, 1000));
      
      const resultados = await this.clienteRepository.query(query, parametrosCompletos);
      
      console.log('Resultados obtenidos del reporte:', resultados.length);
      console.log('Primeros 3 resultados:', JSON.stringify(resultados.slice(0, 3), null, 2));

      // Formatear resultados
      const data = resultados.map((row: any) => {
        const idOperador = Number(row.idOperador);
        return {
          idOperador: idOperador === 0 ? null : idOperador,
          operador: row.operador || 'Sin operador asignado',
          licencia: row.licencia || null,
          turnos: Number(row.turnos) || 0,
          viajes: Number(row.viajes) || 0,
          validaciones: Number(row.validaciones) || 0,
          ingresos: Number(parseFloat(String(row.ingresos)).toFixed(2)) || 0,
          ticketPromedio: Number(parseFloat(String(row.ticketPromedio)).toFixed(2)) || 0,
          evasionPorcentual: Number(parseFloat(String(row.evasionPorcentual)).toFixed(2)) || 0,
          ultimoTurno: row.ultimoTurno || null,
        };
      });

      return {
        data,
      };
    } catch (error) {
      console.error('Error en recaudacionPorOperador:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException({
        message: 'Error al generar el reporte de recaudación por operador',
        error: error.message,
        stack: error.stack,
      });
    }
  }
}
