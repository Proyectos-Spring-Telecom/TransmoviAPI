import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Post,
  Body,
} from '@nestjs/common';
import { MonitoreoService } from './monitoreo.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RecorridoMonitoreoDto } from './dto/recorrido-monitoreo.dto';
import {
  openApiMonitoreoDerroteroItem,
  openApiMonitoreoPosicionItem,
} from 'src/common/openapi-instalaciones-monitoreo.schemas';

@ApiTags('Monitoreo')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard)
@Controller('monitoreo')
export class MonitoreoController {
  constructor(private readonly monitoreoService: MonitoreoService) {}

  @Get('list/:cliente')
  @ApiOperation({
    summary: 'Listado para mapa de monitoreo',
    description:
      'Respuesta: objeto con **`derroteros`** (rutas/regiones del cliente o jerarquía según rol) y **`posicion`** (una fila por instalación activa). Cada fila de `posicion` une solo el dispositivo **principal** (`InstalacionesDispositivos.Principal = 1`) con `UltimaPosicion`. Si no hay principal o no hay última posición, `id`, `latitud`, `longitud`, `idDispositivo`, etc. pueden ser **null** (la instalación igual aparece). Incluye `blueVoxs` por instalación. Orden: `ORDER BY up.Id DESC` (filas sin posición al final).',
  })
  @ApiParam({
    name: 'cliente',
    description: 'ID de cliente (tenant) para filtrar instalaciones/posiciones',
  })
  @ApiResponse({
    status: 200,
    description:
      'Objeto `{ derroteros, posicion }` (no va envuelto en `data` a nivel raíz).',
    schema: {
      type: 'object',
      properties: {
        derroteros: {
          type: 'array',
          items: openApiMonitoreoDerroteroItem,
        },
        posicion: {
          type: 'array',
          items: openApiMonitoreoPosicionItem,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findListPosiciones(
    @Param('cliente', ParseIntPipe) cliente: number,
    @Request() req,
  ) {
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.monitoreoService.monitoreoListado(+idUser, +cliente, +rol);
  }

  @Post('recorrido')
  @ApiOperation({
    summary: 'Recorrido histórico por número de serie',
    description:
      'Devuelve puntos de la tabla **Posiciones** en el rango de fechas. El join usa solo el dispositivo **principal** de cada instalación: el **`NumeroSerieDispositivo`** del body debe ser el del principal; si es el de un dispositivo secundario, la respuesta será **lista vacía** (sin error). Misma forma de enriquecimiento por fila que el listado (dispositivo, `blueVoxs`, vehículo, cliente).',
  })
  @ApiBody({
    type: RecorridoMonitoreoDto,
    description:
      'Obligatorio: `idCliente`, `NumeroSerieDispositivo` (string del principal). Opcional: `fechaInicio` / `fechaFin` (ISO date); si ambas faltan, se usa el día actual desfasado en servidor.',
  })
  @ApiResponse({
    status: 201,
    description:
      '`{ posicion }` donde `posicion` es un arreglo de puntos ordenados por `fechaHora` ascendente.',
    schema: {
      type: 'object',
      properties: {
        posicion: {
          type: 'array',
          items: openApiMonitoreoPosicionItem,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findKpi(
    @Body() recorridoMonitoreoDto: RecorridoMonitoreoDto,
    @Request() req,
  ) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.monitoreoService.monitoreoRecorrido(
      recorridoMonitoreoDto,
      +cliente,
      +rol,
    );
  }
}
