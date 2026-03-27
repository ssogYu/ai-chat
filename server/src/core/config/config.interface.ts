export interface defaultConfg {
  baseUrl?: string;
}
export type AppConfig = {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
} & defaultConfg;
