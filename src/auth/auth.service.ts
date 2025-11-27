import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private comparePassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  async register(email: string, username: string, password: string) {
    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new BadRequestException('Email already in use');
    }

    const existingUsername = await this.userService.findByUsername(username);
    if (existingUsername) {
      throw new BadRequestException('Username already in use');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = this.hashPassword(password);
    return this.userService.create({
      email,
      username,
      password: hashedPassword,
    });
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
