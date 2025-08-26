import { Expose, Transform, Type } from 'class-transformer';
import { ExposePermisoDto } from 'src/permisos/dto/expose-permiso.dto';

export class ExposeModuloDto {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  Id: number;

  @Expose({ name: 'nombre' })
  Nombre: string;

  @Expose({ name: 'descripcion' })
  Descripcion: string | null;

  @Expose({ name: 'estatus' })
  Estatus: number | null;

  @Expose({ name: 'permisos' })
  @Type(() => ExposePermisoDto)
  Permisos?: ExposePermisoDto[];
}