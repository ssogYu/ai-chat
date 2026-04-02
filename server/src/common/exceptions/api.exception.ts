import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodeEnum } from '../enums/error-code.enum';

export class ApiException extends HttpException {
  constructor(
    message: string,
    public readonly errorCode: ErrorCodeEnum,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(
      {
        message,
        errorCode,
      },
      statusCode,
    );
  }
}

export class UnauthorizedApiException extends ApiException {
  constructor(
    message: string,
    errorCode: ErrorCodeEnum = ErrorCodeEnum.UNAUTHORIZED,
  ) {
    super(message, errorCode, HttpStatus.UNAUTHORIZED);
  }
}

export class BadRequestApiException extends ApiException {
  constructor(
    message: string,
    errorCode: ErrorCodeEnum = ErrorCodeEnum.BAD_REQUEST,
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST);
  }
}

export class NotFoundApiException extends ApiException {
  constructor(
    message: string,
    errorCode: ErrorCodeEnum = ErrorCodeEnum.NOT_FOUND,
  ) {
    super(message, errorCode, HttpStatus.NOT_FOUND);
  }
}
export class ForbiddenApiException extends ApiException {
  constructor(
    message: string,
    errorCode: ErrorCodeEnum = ErrorCodeEnum.FORBIDDEN,
  ) {
    super(message, errorCode, HttpStatus.FORBIDDEN);
  }
}
