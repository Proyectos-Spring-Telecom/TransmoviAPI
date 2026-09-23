import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePagoTarjetaDto {
  @ApiProperty({
    example: 500,
    description: 'Monto de la recarga (máximo 2 decimales)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({
    example: 'MXN-ABC123',
    description: 'Identificador del monedero a recargar',
  })
  @IsString()
  @IsNotEmpty()
  monedero: string;
}
