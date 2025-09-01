import { Module } from '@nestjs/common';
import { RutasService } from './rutas.service';
import { RutasController } from './rutas.controller';

@Module({
  controllers: [RutasController],
  providers: [RutasService],
})
export class RutasModule {}
