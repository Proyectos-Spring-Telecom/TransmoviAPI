import { Expose, Transform } from 'class-transformer';

export class ExposeOperadoresDto {
  @Expose({ name: 'id' })
  @Transform(({ value }) => Number(value))
  Id: number;

  @Expose({ name: 'nombre' })
  Nombre: string;

  @Expose({ name: 'apellidoPaterno' })
  ApellidoPaterno: string;

  @Expose({ name: 'apellidoMaterno' })
  ApellidoMaterno: string | null;

  @Expose({ name: 'numeroLicencia' })
  NumeroLicencia: string;

  @Expose({ name: 'fechaNacimiento' })
  FechaNacimiento: Date;

  @Expose({ name: 'correo' })
  Correo: string;

  @Expose({ name: 'telefono' })
  Telefono: string;

  @Expose({ name: 'estatus' })
  Estatus: number;
}
