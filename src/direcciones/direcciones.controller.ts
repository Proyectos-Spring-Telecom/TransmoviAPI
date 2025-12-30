import { Controller, Get, HttpException, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { DireccionesService } from './direcciones.service';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { catchError, map, throwError } from 'rxjs';

@ApiTags('Direcciones')
@Controller('direcciones')
export class DireccionesController {
  private readonly apiUrl = 'https://api.tau.com.mx/dipomex/v1/codigo_postal';
  private readonly apiKey = '56d7a6da1c873c83c818f89e4b0f37fba8c63c36';

  
      constructor(private readonly httpService: HttpService) { }
  
      @Get('/CP/:cp')
      async findAll(@Param('cp') cp:any): Promise<any> {
          const url = `${this.apiUrl}?cp=${cp}`;
  
          return this.httpService.get<any>(url, {
              headers: { 'APIKEY': this.apiKey },
            }).pipe(
              map(response => response.data),  // Extrae solo los datos de la respuesta
              catchError(error => {
                // Manejo del error de manera segura
                const errorMessage = error.response?.data?.message || 'Error desconocido';
                console.error('Error en la solicitud HTTP:', errorMessage);
                return throwError(() => new HttpException(errorMessage, HttpStatus.BAD_REQUEST));
              }),
            );
        
          }
  }
