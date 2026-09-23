import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AcreditarPagoDto {
  @ApiProperty({
    example: 'ORD01M2GT5A29MXGX605JH7DB58Z8',
    description: 'Identificador de la orden en el servicio de pagos',
  })
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @ApiProperty({
    example: 'PAY01M2GT5A2JGBJPHTZS6B70WNSX',
    description: 'Identificador del pago',
  })
  @IsString()
  @IsNotEmpty()
  payment_id: string;

  @ApiProperty({
    example: 'processed',
    description: 'Estatus general de la orden',
  })
  @IsString()
  @IsNotEmpty()
  status: string;

  @ApiProperty({
    example: 'processed',
    description: 'Estatus del pago. Solo se acredita si es processed',
  })
  @IsString()
  @IsNotEmpty()
  payment_status: string;

  @ApiProperty({
    example: 'accredited',
    description:
      'Detalle del estatus. Solo se acredita si es accredited. Rechazado o pendiente no suma saldo',
  })
  @IsString()
  @IsNotEmpty()
  payment_status_detail: string;

  @ApiProperty({
    example: '150.50',
    description: 'Monto total del pago',
  })
  @Transform(({ value }) => Number(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  total_amount: number;

  @ApiProperty({
    example: 'm_MXN-ABC123__o_orden-123',
    required: false,
  })
  @IsString()
  @IsOptional()
  external_reference?: string;

  @ApiProperty({
    example: 'MXN-ABC123',
    description:
      'Identificador del monedero a acreditar (numeroSerie o idCard)',
  })
  @IsString()
  @IsNotEmpty()
  monedero: string;
}
