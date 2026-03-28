export interface TokenPayload {
  sub: string;
  email: string;
  tokenType: 'access' | 'refresh';
}
