import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { LoginAuthPinDto } from './dto/login-pin.dto';

@Controller('login')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @HttpCode(200)
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return this.authService.signIn(loginAuthDto);
  }

  @Post('operador')
  @HttpCode(200)
  async loginPin(@Body() loginAuthPinDto: LoginAuthPinDto) {
    return this.authService.singInPin(loginAuthPinDto);
  }


}
