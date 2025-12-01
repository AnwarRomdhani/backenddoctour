import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, address: true, cin: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, address: true, cin: true },
    });
  }

  async create(data: { email: string; username: string; password: string; firstName?: string; lastName?: string; phone?: string; address?: string; cin?: string }) {
    return this.prisma.user.create({
      data,
      select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, address: true, cin: true },
    });
  }

  async update(id: number, data: Partial<{ email: string; username: string; password: string; firstName: string; lastName: string; phone: string; address: string; cin: string }>) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, address: true, cin: true },
    });
  }

  async delete(id: number) {
    return this.prisma.user.delete({
      where: { id },
      select: { id: true, email: true, username: true, firstName: true, lastName: true, phone: true, address: true, cin: true },
    });
  }
}
