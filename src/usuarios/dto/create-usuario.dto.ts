import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio' })
  @MaxLength(100, {
    message: 'El nombre de usuario no puede exceder los 100 caracteres',
  })
  UserName: string;

  @IsString()
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  Password: string;

  @IsNotEmpty({ message: 'Confirmar email en valor de 0 ó 1' })
  @IsInt({ message: 'emailConfirmed debe ser un número entero' })
  @IsIn([0, 1], { message: 'Solo puede ser 0 ó 1' })
  EmailConfirmed: number = 0;

  @IsNotEmpty({ message: 'Es obligatorio el numero' })
  @IsString()
  @MaxLength(20, { message: 'El teléfono no puede exceder los 20 caracteres' })
  Telefono: string;

  @IsString()
  @IsNotEmpty({ message: 'Es necesario el nombre' })
  @MaxLength(100, { message: 'El nombre no puede exceder los 100 caracteres' })
  Nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'Es obligatorio el apellido paterno' })
  @MaxLength(100, {
    message: 'El apellido paterno no puede exceder los 100 caracteres',
  })
  ApellidoPaterno: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'El apellido materno no puede exceder los 100 caracteres',
  })
  ApellidoMaterno?: string;

  @IsNotEmpty({ message: 'Confirmar estatus en valor de 0 ó 1' })
  @IsInt({ message: 'estatus debe ser un número entero' })
  @IsIn([0, 1], { message: 'Solo puede ser 0 ó 1' })
  Estatus: number = 1;

  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsInt({ message: 'El rol debe ser un identificador numérico válido' })
  IdRol: number = 0;

  @IsNotEmpty({ message: 'El cliente es obligatorio' })
  @IsInt({ message: 'emailConfirmed debe ser un número entero' })
  IdCliente: number = 0;
}