import { Expose, Transform } from 'class-transformer';

export class UsuariosDto {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  Id: number;

  @Expose({ name: 'userName' })
  UserName: string;

  @Expose({ name: 'password' })
  Password: string;

  @Expose({ name: 'emailConfirmed' })
  EmailConfirmed: number | null;

  @Expose({ name: 'telefono' })
  Telefono: string | null;

  @Expose({ name: 'nombre' })
  Nombre: string | null;

  @Expose({ name: 'apellidoPaterno' })
  ApellidoPaterno: string | null;

  @Expose({ name: 'apellidoMaterno' })
  ApellidoMaterno: string | null;

  @Expose({ name: 'estatus' })
  Estatus: number;

  @Expose({ name: 'idRol' })
  IdRol: number | null;

  @Expose({ name: 'idCliente' })
  IdCliente: number | null;
}
