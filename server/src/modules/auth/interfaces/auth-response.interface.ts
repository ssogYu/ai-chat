import { UserEntity } from '../../users/entities/user.entity';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserEntity;
  tokens: AuthTokens;
}
