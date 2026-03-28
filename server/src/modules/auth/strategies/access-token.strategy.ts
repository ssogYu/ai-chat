import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../interfaces/auth-user.interface';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: TokenPayload): AuthUser {
    if (payload.tokenType !== 'access') {
      throw new UnauthorizedException('无效的访问令牌');
    }

    return {
      sub: payload.sub,
      email: payload.email,
    };
  }
}
