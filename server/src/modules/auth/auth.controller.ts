import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard, RefreshTokenGuard } from '../../common/guards';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from './interfaces/auth-user.interface';
import type { AuthResult } from './interfaces/auth-response.interface';
import { UserEntity } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    const cookieName = this.configService.getOrThrow<string>('cookie.name');
    const httpOnly = this.configService.getOrThrow<boolean>('cookie.httpOnly');
    const secure = this.configService.getOrThrow<boolean>('cookie.secure');
    const sameSite = this.configService.getOrThrow<'strict' | 'lax' | 'none'>(
      'cookie.sameSite',
    );
    const path = this.configService.getOrThrow<string>('cookie.path');
    const maxAge = this.configService.getOrThrow<number>('cookie.maxAge');

    res.cookie(cookieName, refreshToken, {
      httpOnly,
      secure,
      sameSite,
      path,
      maxAge,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    const cookieName = this.configService.getOrThrow<string>('cookie.name');
    const path = this.configService.getOrThrow<string>('cookie.path');

    res.clearCookie(cookieName, {
      path,
    });
  }

  private buildAuthResponse(result: AuthResult) {
    return {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
      },
    };
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    if (result.tokens.refreshToken) {
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    }
    return this.buildAuthResponse(result);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: '邮箱或密码错误' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    if (result.tokens.refreshToken) {
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    }
    return this.buildAuthResponse(result);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: '刷新令牌' })
  @ApiBearerAuth('refresh-token')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: '刷新令牌无效' })
  async refresh(
    @CurrentUser() currentUser: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refreshTokens(currentUser);
    if (result.tokens.refreshToken) {
      this.setRefreshTokenCookie(res, result.tokens.refreshToken);
    }
    return this.buildAuthResponse(result);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '退出登录' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: LogoutResponseDto })
  async logout(
    @CurrentUser() currentUser: AuthUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.clearRefreshTokenCookie(res);
    return this.authService.logout(currentUser.sub);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '获取当前登录用户' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: UserEntity })
  async me(@CurrentUser() currentUser: AuthUser) {
    const user = await this.usersService.findById(currentUser.sub);
    return user ? this.usersService.toEntity(user) : null;
  }
}
