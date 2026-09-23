import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatMetodoPago } from 'src/entities/CatMetodoPago';
import { HistoricoTransaccionesRecarga } from 'src/entities/HistoricoTransaccionesRecarga';
import { Monederos } from 'src/entities/Monederos';
import { Pagos } from 'src/entities/Pagos';
import { TransaccionesRecarga } from 'src/entities/TransaccionesRecarga';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Monederos,
      TransaccionesRecarga,
      HistoricoTransaccionesRecarga,
      CatMetodoPago,
      Pagos,
    ]),
  ],
  controllers: [PagosController],
  providers: [PagosService],
})
export class PagosModule {}
