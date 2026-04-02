import { createHttpRequest } from "@unifying/core";
export const request = createHttpRequest({
  baseURL: "http://localhost:3000",
  timeout: 30000,
  withCredentials: true,
  tokenKey: "ai_chat_token",
});
