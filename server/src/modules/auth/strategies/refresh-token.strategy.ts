import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthUser } from '../interfaces/auth-user.interface';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
  }

  validate(request: Request, payload: TokenPayload): AuthUser {
    const authHeader = request.headers.authorization;
    const refreshToken = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!refreshToken || payload.tokenType !== 'refresh') {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
