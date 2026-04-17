import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UserEntity } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.usersRepository.updateRefreshTokenHash(userId, refreshTokenHash);
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await this.usersRepository.updateLastLoginAt(userId);
  }

  toEntity(user: User): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
