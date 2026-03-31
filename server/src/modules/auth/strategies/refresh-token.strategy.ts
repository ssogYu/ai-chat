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
  private readonly cookieName: string;

  constructor(configService: ConfigService) {
    const cookieName = configService.getOrThrow<string>('cookie.name');
    super({
      jwtFromRequest: (request: Request): string | null => {
        let token: string | null = null;
        if (request.cookies && request.cookies[cookieName]) {
          token = request.cookies[cookieName];
        } else {
          const authHeader = request.headers.authorization;
          if (authHeader) {
            token = authHeader.replace(/^Bearer\s+/i, '').trim();
          }
        }
        return token;
      },
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
    });
    this.cookieName = cookieName;
  }

  validate(request: Request, payload: TokenPayload): AuthUser {
    let refreshToken: string | undefined;
    if (request.cookies && request.cookies[this.cookieName]) {
      refreshToken = request.cookies[this.cookieName];
    } else {
      const authHeader = request.headers.authorization;
      if (authHeader) {
        refreshToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      }
    }

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
