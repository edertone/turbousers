import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, LogoutDto, RefreshTokenDto, RegisterDto } from './dto/auth.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './types/jwt-payload.interface';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      select: this.publicUserSelect(),
    });

    return user;
  }

  async login(dto: LoginDto): Promise<{ user: AuthUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const validPassword = await compare(dto.password, user.passwordHash);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user);
    const authUser = this.toAuthUser(user);

    return { user: authUser, tokens };
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'change_me_refresh_secret',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type.');
    }

        const tokenHash = this.hashToken(dto.refreshToken);
        const stored = await this.prisma.refreshToken.findUnique({
          where: { token: tokenHash },
        });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token is invalid or revoked.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: stored.userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active.');
    }

    // rotate the token: revoke old, issue new
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(user);
  }

  async logout(dto: LogoutDto): Promise<{ success: boolean }> {
      const tokenHash = this.hashToken(dto.refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { token: tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return { success: true };
    }

  async validateUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.publicUserSelect(),
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      return null;
    }
    return user;
  }

  private async generateTokens(user: User): Promise<TokenPair> {
    const base: Omit<JwtPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(
      { ...base, type: 'access' },
      {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'change_me_access_secret',
        ),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const refreshString = await this.jwtService.signAsync(
          { ...base, type: 'refresh', jti: randomUUID() },
      {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'change_me_refresh_secret',
        ),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    // Hash refresh token before storing (defense-in-depth)
    const tokenHash = this.hashToken(refreshString);
    const expiresIn = this.parseExpiry(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        token: tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    return { accessToken, refreshToken: refreshString };
  }

  private hashToken(token: string): string {
      return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60;
    }
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit] as number;
    return amount * multiplier;
  }

  private publicUserSelect() {
    return {
      id: true,
      email: true,
      role: true,
      status: true,
      emailVerified: true,
      firstName: true,
      lastName: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }
}