import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard, RefreshTokenGuard } from '../../common/guards';
import { UsersService } from '../users/users.service';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import type { AuthUser } from './interfaces/auth-user.interface';
import { UserEntity } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthResponseDto })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: '邮箱或密码错误' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: '刷新令牌' })
  @ApiBearerAuth('refresh-token')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: '刷新令牌无效' })
  refresh(@CurrentUser() currentUser: AuthUser) {
    return this.authService.refreshTokens(currentUser);
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: '退出登录' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@CurrentUser() currentUser: AuthUser) {
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
