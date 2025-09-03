import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MaxLength,
} from "class-validator";

export class CreateDispositivoDto {
  @IsString()
  @IsNotEmpty({ message: "El número de serie es obligatorio" })
  @MaxLength(100, { message: "El número de serie no puede exceder 100 caracteres" })
  @ApiProperty({ description: "Número de serie único del dispositivo", example: "SN1234567890" })
  numeroSerie: string;

  @IsString()
  @IsNotEmpty({ message: "La marca es obligatoria" })
  @MaxLength(100, { message: "La marca no puede exceder 100 caracteres" })
  @ApiProperty({ description: "Marca del dispositivo", example: "Samsung" })
  marca: string;

  @IsString()
  @IsNotEmpty({ message: "El modelo es obligatorio" })
  @MaxLength(100, { message: "El modelo no puede exceder 100 caracteres" })
  @ApiProperty({ description: "Modelo del dispositivo", example: "Galaxy X1" })
  modelo: string;

  @IsOptional()
  @IsInt({ message: "Estatus debe ser 0 ó 1" })
  @ApiProperty({ description: "Estatus del dispositivo (1=Activo, 0=Inactivo)", example: 1, required: false })
  estatus?: number = 1;

  @IsInt({ message: "IdCliente debe ser un número entero" })
  @ApiProperty({ description: "Id del cliente propietario del dispositivo", example: 5 })
  idCliente: number;
}
