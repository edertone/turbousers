import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type AuthUser = {
  id: string;
  email: string;
  status: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
  data?: Prisma.JsonValue | null;
};

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    return data ? user?.[data] : user;
  },
);
