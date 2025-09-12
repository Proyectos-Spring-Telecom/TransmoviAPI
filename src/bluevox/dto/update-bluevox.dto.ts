import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBlueVoxsDto } from './create-bluevox.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBluevoxDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Número de serie único del dispositivo BlueVoxs',
    example: 'BVX-12345-XYZ',
  })
  numeroSerie?: string;

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

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    description: 'Identificador del cliente al que pertenece el dispositivo',
    example: '123',
  })
  idCliente?: number;
}
