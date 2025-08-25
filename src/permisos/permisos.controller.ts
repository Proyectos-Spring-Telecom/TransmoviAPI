import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { Permisos } from 'src/entities/Permisos';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('permisos')
@UseGuards(JwtAuthGuard)
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Post()
  async createPermioo(@Body() createPermiso: CreatePermisoDto, @Req() req) {
    const idUsuario = req.user.userId;
    console.log(idUsuario);
    return this.permisosService.createPermiso(createPermiso, idUsuario);
  }

  @Get('page/:page/:limit')
  findAll(@Param('page') page: string, @Param('limit') limit: string) {
    return this.permisosService.findAll(Number(page), Number(limit));
  }

  @Get('list')
  async findAllList(): Promise<any[]> {
    const permiso = await this.permisosService.findAllList();
    return permiso;
  }

  @Get('permisosAgrupados')
  async findAllAgrupado(@Req() req): Promise<any[]> {
    const idUsuario = req.user.userId;
    const permiso =
      await this.permisosService.obtenerPermisosAgrupados(idUsuario);
    return permiso;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permisosService.findOne( +id);
  }

  @Put()
  update(@Body() updatePermisoDto: UpdatePermisoDto) {
    return this.permisosService.update(updatePermisoDto);
  }

  @Patch()
  updatePermisoEstatus() {}

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permisosService.remove(+id);
  }

}
