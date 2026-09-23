import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePagoDto {
  @ApiProperty({
    example: 150.5,
    description: 'Monto de la recarga (máximo 2 decimales)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  transaction_amount: number;

  @ApiProperty({
    example: 'MXN-ABC123',
    description: 'Identificador del monedero a recargar',
  })
  @IsString()
  @IsNotEmpty()
  monedero: string;
}
