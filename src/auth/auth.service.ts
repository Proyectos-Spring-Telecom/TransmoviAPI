import { Injectable } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuarios } from 'src/entities/Usuarios';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';




@Injectable()
export class AuthService {
  constructor(@InjectRepository(Usuarios) private readonly usuariosRepository: Repository<Usuarios>,
  private readonly jwtService: JwtService,  
){}

  async signIn(loginAuthDto: LoginAuthDto) {
    try {
      const user = await this.usuariosRepository.findOne({where:{userName:loginAuthDto.email}});
      if (!user || !(await bcrypt.compare(loginAuthDto.password, user.password)))
    } catch (error) {
      
    }
  }


}
