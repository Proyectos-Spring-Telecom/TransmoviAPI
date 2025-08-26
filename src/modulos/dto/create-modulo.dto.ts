import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateModuloDto {
    @IsString()
    @IsNotEmpty()
    @ApiProperty({
        description: 'Nombre del módulo',
        example: 'Módulos',
    })
    Nombre: string;
    @IsString()
    @IsNotEmpty()
        @ApiProperty({
        description: 'Descripción del módulo',
        example: 'Módulo',
    })
    Descripcion: string;
}
