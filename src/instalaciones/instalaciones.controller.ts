import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { InstalacionesService } from './instalaciones.service';
import { CreateInstalacionesDto } from './dto/create-instalacione.dto';
import { UpdateInstalacioneDto } from './dto/update-instalacione.dto';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { ApiCrudResponse, ApiResponseCommon } from 'src/common/ApiResponse';
import { UpdateInstalacioneEstatusDto } from './dto/update-instalacione-estatus.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBody,
} from '@nestjs/swagger';
import { openApiInstalacionListadoItem } from 'src/common/openapi-instalaciones-monitoreo.schemas';

@ApiTags('Instalaciones')
@ApiBearerAuth('bearer-token')
@UseGuards(JwtAuthGuard)
@Controller('instalaciones')
export class InstalacionesController {
  constructor(private readonly instalacionesService: InstalacionesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear instalación',
    description:
      'Crea la instalación y los vínculos en `InstalacionesDispositivos` / `InstalacionesBlueVoxs`. Requiere al menos un ID en `idsDispositivos` y al menos uno en `idsBlueVoxs`. Opcional: **`idDispositivoPrincipal`** — debe existir dentro de `idsDispositivos`; marca exactamente un dispositivo con `Principal = 1` en BD y el resto con `Principal = null` (nunca 0). Si no se envía, todos los dispositivos quedan sin principal. Se registra histórico con snapshot de dispositivos (incluye `Principal` por elemento).',
  })
  @ApiBody({
    type: CreateInstalacionesDto,
    description:
      'Cuerpo validado por `CreateInstalacionesDto`: idsDispositivos, idVehiculo, idCliente, idsBlueVoxs, opcional idDispositivoPrincipal y estatus.',
  })
  @ApiResponse({
    status: 201,
    description: 'Instalación creada exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: { id: { type: 'number' }, nombre: { type: 'string' } },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Componentes inválidos o no disponibles',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async create(
    @Body() createInstalacioneDto: CreateInstalacionesDto,
    @Request() req,
  ): Promise<ApiCrudResponse> {
    const idUser = req.user.userId;
    const cliente = req.user.cliente;
    return await this.instalacionesService.create(
      +idUser,
      +cliente,
      createInstalacioneDto,
    );
  }

  @Get(':page/:limit')
  @ApiOperation({
    summary: 'Obtener instalaciones paginadas',
    description:
      'Lista instalaciones según rol/jerarquía. Cada elemento incluye **`dispositivos`**: arreglo de dispositivos activos con `idDispositivo`, `numeroSerieDispositivo`, `marcaDispositivo`, `modeloDispositivo`, **`principal`** (`1` | `null`). Incluye **`blueVoxs`** en el mismo patrón que instalaciones.',
  })
  @ApiParam({ name: 'page', description: 'Número de página (desde 1)' })
  @ApiParam({ name: 'limit', description: 'Registros por página' })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de instalaciones',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: openApiInstalacionListadoItem },
        paginated: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            lastPage: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAll(
    @Param('page', ParseIntPipe) page: number,
    @Param('limit', ParseIntPipe) limit: number,
    @Request() req,
  ) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return await this.instalacionesService.findAll(
      +idUser,
      +cliente,
      +rol,
      page,
      limit,
    );
  }

  @Get('list')
  @ApiOperation({
    summary: 'Listar instalaciones',
    description:
      'Listado sin paginación; misma forma de cada ítem que en GET paginado: `dispositivos[]` con `principal` por fila, `blueVoxs[]`, vehículo y cliente.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de instalaciones',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: openApiInstalacionListadoItem },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findAllList(@Request() req): Promise<ApiResponseCommon> {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return await this.instalacionesService.findAllList(+idUser, +cliente, +rol);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener instalación por ID',
    description:
      'Devuelve `{ data }` donde `data` es un arreglo (habitualmente un elemento) con la misma estructura que el listado: `dispositivos[]` (con `principal`), `blueVoxs[]`, datos de vehículo y cliente.',
  })
  @ApiParam({ name: 'id', description: 'ID de la instalación' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la instalación',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: openApiInstalacionListadoItem },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Instalación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async findOne(@Param('id') id: string, @Request() req) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return await this.instalacionesService.findOne(
      +id,
      +idUser,
      +cliente,
      +rol,
    );
  }

  @Patch('estatus/:id')
  @ApiOperation({
    summary: 'Actualizar estatus de una instalación',
    description:
      'Actualiza el estatus de una instalación (activa/inactiva) y ajusta automáticamente el estado de los componentes asociados (Dispositivo, Vehículo, BlueVoxs). Soporta múltiples BlueVoxs por instalación.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la instalación a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatus de la instalación actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example:
            'El estatus de las instalaciones ha sido actualizado con éxito.',
        },
        estatus: {
          type: 'object',
          properties: {
            estatus: { type: 'number', example: 1 },
          },
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nombre: { type: 'string', example: '1 dispositivo:5 vehiculo: 10' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Instalación no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Conflictos de uso o componentes no disponibles',
  })
  updateEstatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstalacioneEstatusDto: UpdateInstalacioneEstatusDto,
    @Request() req,
  ) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.instalacionesService.updateEstatus(
      id,
      +idUser,
      +cliente,
      +rol,
      updateInstalacioneEstatusDto,
    );
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar una instalación',
    description:
      'Actualiza vehículo/cliente opcional, lista `idsDispositivos` (matriz en servidor), `idsBlueVoxs`, `dispositivosAnteriores`, `blueVoxsAnteriores` y comentarios. **Dispositivo principal:** si el body incluye **`idDispositivoPrincipal`**, debe corresponder a un dispositivo asociado **activo** (Estatus=1 en `InstalacionesDispositivos`) después de aplicar `idsDispositivos`; se reconcilia el único `Principal=1` en BD. Si **no** se envía `idDispositivoPrincipal`, el principal actual no se modifica. El histórico guarda snapshot con `Principal` por dispositivo.',
  })
  @ApiBody({
    type: UpdateInstalacioneDto,
    description:
      'Campos opcionales según `UpdateInstalacioneDto`; ver propiedades documentadas en el modelo (idsDispositivos, idDispositivoPrincipal, idsBlueVoxs, etc.).',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID de la instalación a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Instalación actualizada exitosamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        message: {
          type: 'string',
          example: 'Las instalaciones se actualizaron con éxito.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            nombre: {
              type: 'string',
              example:
                'Instalación 1 asociada a Dispositivo: 5 y Vehículo: 10.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Instalación no encontrada',
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación o BlueVoxs inválidos',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInstalacioneDto: UpdateInstalacioneDto,
    @Request() req,
  ) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return await this.instalacionesService.update(
      id,
      +idUser,
      +cliente,
      +rol,
      updateInstalacioneDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar instalación',
    description: 'Elimina una instalación del sistema.',
  })
  @ApiParam({ name: 'id', description: 'ID de la instalación a eliminar' })
  @ApiResponse({
    status: 200,
    description: 'Instalación eliminada correctamente',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: { id: { type: 'number' }, nombre: { type: 'string' } },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Instalación no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  remove(@Param('id') id: string, @Request() req) {
    const cliente = req.user.cliente;
    const idUser = req.user.userId;
    const rol = req.user.rol;
    return this.instalacionesService.remove(+id, +cliente, +idUser, +rol);
  }
}
