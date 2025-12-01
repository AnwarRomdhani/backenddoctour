import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

export class RegisterDto {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  cin?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(
      body.email,
      body.username,
      body.password,
      body.firstName,
      body.lastName,
      body.phone,
      body.address,
      body.cin,
    );
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }
}
