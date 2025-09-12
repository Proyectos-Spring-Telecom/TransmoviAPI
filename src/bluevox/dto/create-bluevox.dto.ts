import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsIn,
} from 'class-validator';

export class CreateBlueVoxsDto {
  @IsString()
  @IsNotEmpty({ message: 'El número de serie es obligatorio' })
  @ApiProperty({
    description: 'Número de serie único del dispositivo BlueVoxs',
    example: 'BVX-12345-XYZ',
  })
  numeroSerie: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Marca del dispositivo',
    example: 'BlueTech',
    required: false,
  })
  marca?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Modelo del dispositivo',
    example: 'BX-2025',
    required: false,
  })
  modelo?: string;

  @IsNotEmpty({ message: 'Confirmar estatus en valor de 0 ó 1' })
  @IsInt({ message: 'estatus debe ser un número entero' })
  @IsIn([0, 1], { message: 'Solo puede ser 0 ó 1' })
  estatus: number = 1;

  @IsNumber()
  @IsNotEmpty({ message: 'El IdCliente es obligatorio' })
  @ApiProperty({
    description: 'Identificador del cliente al que pertenece el dispositivo',
    example: '123',
  })
  idCliente: number;
}
