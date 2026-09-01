import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DashboardGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token: string | undefined = request.cookies?.['dashboard_token'];

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.getDashSecret(),
      });
      // attach for later use if needed
      request.dashboardUser = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private getDashSecret(): string {
    return (
      this.configService.get<string>('DASHBOARD_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET', 'change_me_access_secret')
    );
  }
}