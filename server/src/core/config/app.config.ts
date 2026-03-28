import { registerAs } from '@nestjs/config';
import { AppConfig } from './config.interface';

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
