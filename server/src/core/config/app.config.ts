import { registerAs } from '@nestjs/config';
import { AppConfig, CookieConfig } from './config.interface';

export default registerAs('app', (): AppConfig => {
  return {
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    port: parseInt(process.env.PORT as string, 10) || 3000,
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test',
    baseUrl: process.env.BASE_URL as string,
    corsOrigin: process.env.CORS_ORIGIN as string,
  };
});

export const cookieConfig = registerAs('cookie', (): CookieConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken',
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/auth/refresh',
    maxAge: parseInt(process.env.JWT_REFRESH_TTL_MS || '604800000', 10),
  };
});
