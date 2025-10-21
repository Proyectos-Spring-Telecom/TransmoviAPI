import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsNumber } from 'class-validator';

export class UpdateHistoricoDto {

  @IsOptional()
  @IsNumber()
  idInstalacion?: number;

  @IsOptional()
  @IsNumber()
  idDispositivo?: number;


  @IsOptional()
  @IsNumber()
  idBlueVox?: number;

  @IsOptional()
  @IsNumber()
  idVehiculo?: number;


  @IsOptional()
  @IsNumber()
  idCliente?: number;

}
