// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // 切换到 HTTP 上下文并获取 Request 对象
    const request = ctx.switchToHttp().getRequest();
    // 获取由 AuthGuard (Passport) 挂载的 user 对象
    const user = request.user;
    // 如果没有 user（可能接口没加登录拦截），返回 null
    if (!user) {
      return null;
    }
    // 如果在使用装饰器时传入了具体的字段名（例如 @CurrentUser('id')），则只返回该字段
    // 否则返回整个 user 对象
    return data ? user[data] : user;
  },
);
