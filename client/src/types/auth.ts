export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AuthTokens {
    accessToken: string;
}

export interface AuthResponse {
    user: User;
    tokens: AuthTokens;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name?: string;
    avatar?: string;
}
