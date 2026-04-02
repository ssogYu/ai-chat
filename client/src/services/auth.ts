import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types";
import { BaseResponse } from "@unifying/core";
import { request } from "./request";

export const authService = {
  async login(data: LoginRequest): Promise<BaseResponse<AuthResponse>> {
    return await request.post<AuthResponse>("/auth/login", data);
  },

  async register(data: RegisterRequest): Promise<BaseResponse<AuthResponse>> {
    return await request.post<AuthResponse>("/auth/register", data);
  },
  async getMe(): Promise<BaseResponse<User>> {
    return await request.get<User>("/auth/me");
  },

  async logout(): Promise<BaseResponse<void>> {
    return await request.post<void>("/auth/logout");
  },
};
