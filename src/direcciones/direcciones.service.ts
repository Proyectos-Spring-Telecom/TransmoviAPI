import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class DireccionesService {
  private readonly apiUrl: string = 'https://api.copomex.com/query/info_cp';
  private readonly apiKey: string = '56d7a6da1c873c83c818f89e4b0f37fba8c63c36';

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async findByCodigoPostal(cp: string): Promise<any> {
    try {
      // La API de Copomex espera el token como parámetro en la URL
      const url = `${this.apiUrl}?cp=${cp}&token=${this.apiKey}`;

      console.log('[DIRECCIONES] URL:', url);
      console.log('[DIRECCIONES] API Key presente:', !!this.apiKey);
      console.log('[DIRECCIONES] Código postal:', cp);

      const response = await firstValueFrom(
        this.httpService.get<any>(url).pipe(
          map(response => response.data),
          catchError(error => {
            console.error('[DIRECCIONES] Error completo:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data,
              message: error.message,
              url: error.config?.url,
            });

            const errorMessage =
              error.response?.data?.error_message ||
              error.response?.data?.message ||
              error.response?.data?.error ||
              error.response?.data?.error_description ||
              error.message ||
              'Error desconocido al consultar direcciones';

            console.error('[DIRECCIONES] Error en la solicitud HTTP:', errorMessage);
            return throwError(() => new HttpException(errorMessage, error.response?.status || HttpStatus.BAD_REQUEST));
          }),
        ),
      );

      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('[DIRECCIONES] Error no manejado:', error);
      throw new HttpException(
        'Error al consultar direcciones por código postal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

