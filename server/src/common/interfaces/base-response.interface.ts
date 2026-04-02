import { ErrorCodeEnum, ErrorCodeMessageMap } from '../enums/error-code.enum';

export interface BaseResponse<T = any> {
  code: ErrorCodeEnum;
  message: string;
  data: T;
}

export class ApiResponse<T> {
  code: ErrorCodeEnum;
  message: string;
  data: T;

  constructor(code: ErrorCodeEnum, message: string, data: T) {
    this.code = code;
    this.message = message;
    this.data = data;
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse<T>(
      ErrorCodeEnum.SUCCESS,
      message || ErrorCodeMessageMap[ErrorCodeEnum.SUCCESS],
      data,
    );
  }

  static error(
    message: string,
    code: ErrorCodeEnum = ErrorCodeEnum.INTERNAL_SERVER_ERROR,
  ): ApiResponse<null> {
    return new ApiResponse<null>(code, message, null);
  }
}
