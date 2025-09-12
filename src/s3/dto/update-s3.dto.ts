import { IsIn, IsNotEmpty,IsString } from 'class-validator';

export class UploadDto {
  @IsNotEmpty()
  @IsIn(['clientes', 'operadores', 'usuarios'], {
    message: 'El folder debe ser uno de: clientes, operadores, usuarios',
  })
  folder: string;

  @IsNotEmpty()
  @IsString({ message: 'idModule debe ser un número' })
  idModule: string;
}
