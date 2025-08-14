import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from 'src/usuarios/entities/usuario.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports:[
    ConfigModule,
    UsuariosModule,
    JwtModule.registerAsync({
      imports:[ConfigModule],
      inject:[ConfigService],
      useFactory:(config: ConfigService)=>({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {expiresIn: config.get<string>('JWT_EXPIRES_IN')}
      })
    }),
    TypeOrmModule.forFeature([Usuario]),],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
