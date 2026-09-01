import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';

@Injectable()
export class DashboardService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async validateCredentials(username: string, password: string) {
    const expectedUser = this.configService.get<string>(
      'DASHBOARD_USERNAME',
      'admin',
    );
    const expectedPass = this.configService.get<string>(
      'DASHBOARD_PASSWORD',
      'admin123',
    );

    if (username !== expectedUser || password !== expectedPass) {
      throw new UnauthorizedException('Invalid dashboard credentials.');
    }

    const payload = { sub: 'dashboard', role: 'admin', type: 'dashboard' };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.getSecret(),
      expiresIn: '8h',
    });

    return { token, expiresInMs: 8 * 60 * 60 * 1000 };
  }

    verifyToken(token: string): boolean {
      try {
        this.jwtService.verify(token, { secret: this.getSecret() });
        return true;
      } catch {
        return false;
      }
    }

  private getSecret(): string {
    return (
      this.configService.get<string>('DASHBOARD_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET', 'change_me_access_secret')
    );
  }
}