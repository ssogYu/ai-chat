export enum ErrorCodeEnum {
  SUCCESS = 0,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export enum ErrorMessageEnum {
  SUCCESS = '操作成功',
  BAD_REQUEST = '请求参数错误',
  UNAUTHORIZED = '登录已过期，请重新登录',
  FORBIDDEN = '没有权限访问该资源',
  NOT_FOUND = '资源不存在',
  INTERNAL_SERVER_ERROR = '服务器内部错误',
}

export const ErrorCodeMessageMap: Record<ErrorCodeEnum, string> = {
  [ErrorCodeEnum.SUCCESS]: ErrorMessageEnum.SUCCESS,
  [ErrorCodeEnum.BAD_REQUEST]: ErrorMessageEnum.BAD_REQUEST,
  [ErrorCodeEnum.UNAUTHORIZED]: ErrorMessageEnum.UNAUTHORIZED,
  [ErrorCodeEnum.FORBIDDEN]: ErrorMessageEnum.FORBIDDEN,
  [ErrorCodeEnum.NOT_FOUND]: ErrorMessageEnum.NOT_FOUND,
  [ErrorCodeEnum.INTERNAL_SERVER_ERROR]: ErrorMessageEnum.INTERNAL_SERVER_ERROR,
};
