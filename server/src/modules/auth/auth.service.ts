import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResult, AuthTokens } from './interfaces/auth-response.interface';
import type { AuthUser } from './interfaces/auth-user.interface';
import type { TokenPayload } from './interfaces/token-payload.interface';
import {
  BadRequestApiException,
  UnauthorizedApiException,
} from 'src/common/exceptions/api.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    const normalizedEmail = registerDto.email.trim().toLowerCase();
    const passwordHash = await this.hashValue(registerDto.password);

    try {
      const user = await this.usersService.create({
        email: normalizedEmail,
        name: registerDto.name?.trim() || null,
        passwordHash,
      });
      //生产refreshToken和accessToken
      const tokens = await this.issueTokens(user.id, user.email);
      //refreshToken存库
      await this.usersService.updateRefreshTokenHash(
        user.id,
        await this.hashValue(tokens.refreshToken!),
      );

      return {
        user: this.usersService.toEntity(user),
        tokens,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestApiException('邮箱已被注册');
      }

      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new BadRequestApiException('邮箱或密码错误');
    }

    const passwordMatched = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new BadRequestApiException('邮箱或密码错误');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await Promise.all([
      this.usersService.updateRefreshTokenHash(
        user.id,
        await this.hashValue(tokens.refreshToken!),
      ),
      this.usersService.updateLastLoginAt(user.id),
    ]);

    return {
      user: this.usersService.toEntity(user),
      tokens,
    };
  }

  async refreshTokens(currentUser: AuthUser): Promise<AuthResult> {
    if (!currentUser.refreshToken) {
      throw new UnauthorizedApiException('缺少刷新令牌');
    }

    const user = await this.usersService.findById(currentUser.sub);

    if (!user?.refreshTokenHash) {
      throw new UnauthorizedApiException('刷新令牌无效');
    }

    const refreshTokenMatched = await bcrypt.compare(
      currentUser.refreshToken,
      user.refreshTokenHash,
    );

    if (!refreshTokenMatched) {
      throw new UnauthorizedApiException('刷新令牌无效');
    }

    const tokens = await this.issueTokens(user.id, user.email);
    await this.usersService.updateRefreshTokenHash(
      user.id,
      await this.hashValue(tokens.refreshToken!),
    );

    const refreshedUser = await this.usersService.findById(user.id);

    if (!refreshedUser) {
      throw new UnauthorizedApiException('用户不存在');
    }

    return {
      user: this.usersService.toEntity(refreshedUser),
      tokens,
    };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshTokenHash(userId, null);
  }

  private async issueTokens(
    userId: string,
    email: string,
  ): Promise<AuthTokens> {
    const accessPayload: TokenPayload = {
      sub: userId,
      email,
      tokenType: 'access',
    };
    const refreshPayload: TokenPayload = {
      sub: userId,
      email,
      tokenType: 'refresh',
    };
    const accessTtl =
      this.configService.getOrThrow<StringValue>('JWT_ACCESS_TTL');
    const refreshTtl =
      this.configService.getOrThrow<StringValue>('JWT_REFRESH_TTL');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashValue(value: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 12);
    return bcrypt.hash(value, saltRounds);
  }
}
