import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class RecorridoMonitoreoDto {
  @IsInt()
  @IsNotEmpty({ message: 'El IdCliente es obligatorio' })
  @ApiProperty({
    description:
      'ID del cliente (tenant). Debe coincidir con el cliente del contexto; el recorrido solo incluye posiciones de instalaciones de ese cliente.',
    example: 5,
    required: true,
  })
  idCliente: number;

  @ApiProperty({
    description:
      'Número de serie del **dispositivo principal** de la instalación (`InstalacionesDispositivos.Principal = 1`). Si se envía el número de serie de un dispositivo que no es principal, la API responde con lista vacía.',
    example: 'DIS-001A',
    required: true,
  })
  @IsString({ message: 'Debe ser formato string' })
  @IsNotEmpty({ message: 'El numero de serie del dispositivo es obligatorio' })
  NumeroSerieDispositivo: string;

  @ApiProperty({
    description:
      'Fecha inicio del rango (opcional). Si no se envía con fechaFin, se usa la fecha actual.',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @ApiProperty({
    description:
      'Fecha fin del rango (opcional). Si no se envía con fechaInicio, se usa la fecha actual.',
    example: '2025-01-20',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
