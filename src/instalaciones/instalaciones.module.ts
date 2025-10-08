import { Module } from '@nestjs/common';
import { InstalacionesService } from './instalaciones.service';
import { InstalacionesController } from './instalaciones.controller';
import { BitacoraModule } from 'src/bitacora/bitacora.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Instalaciones } from 'src/entities/Instalaciones';
import { UsuariosInstalaciones } from 'src/entities/UsuariosInstalaciones';
import { Dispositivos } from 'src/entities/Dispositivos';
import { BlueVoxs } from 'src/entities/BlueVoxs';
import { Vehiculos } from 'src/entities/Vehiculos';

@Module({
  imports: [TypeOrmModule.forFeature([Instalaciones,UsuariosInstalaciones,Dispositivos,BlueVoxs,Vehiculos]), BitacoraModule],
  controllers: [InstalacionesController],
  providers: [InstalacionesService],
})
export class InstalacionesModule {}
