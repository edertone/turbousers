import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateUserDto,
  QueryUsersDto,
  UpdatePasswordDto,
  UpdateUserDto,
} from './dto/user.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

const PUBLIC_SELECT = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerified: true,
  firstName: true,
  lastName: true,
  phone: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email is already in use.');
    }

    const passwordHash = await hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role ?? Role.USER,
        status: dto.status ?? UserStatus.ACTIVE,
        emailVerified: this.parseBool(dto.emailVerified) ?? false,
      },
      select: PUBLIC_SELECT,
    });
  }

  async findAll(query: QueryUsersDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.ensureExists(id);

    // Prevent an admin from demoting themselves / locking themselves out
    if (id === actor.id) {
      if (dto.role && dto.role !== user.role) {
        throw new BadRequestException(
          'You cannot change your own role. Ask another admin.',
        );
      }
      if (dto.status && dto.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'You cannot deactivate your own account.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: dto.role,
        status: dto.status,
        emailVerified:
          dto.emailVerified !== undefined
            ? this.parseBool(dto.emailVerified)
            : undefined,
      },
      select: PUBLIC_SELECT,
    });
  }

  async setStatus(id: string, status: UserStatus, actor: AuthUser) {
    if (id === actor.id && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: PUBLIC_SELECT,
    });
  }

  async setRole(id: string, role: Role, actor: AuthUser) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot change your own role.');
    }
    await this.ensureExists(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: PUBLIC_SELECT,
    });
  }

  async updatePassword(id: string, dto: UpdatePasswordDto) {
    await this.ensureExists(id);
    const passwordHash = await hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { success: true };
  }

  async remove(id: string, actor: AuthUser) {
    if (id === actor.id) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    await this.ensureExists(id);
    await this.prisma.user.delete({ where: { id } });
    return { success: true, id };
  }

  private async ensureExists(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  private parseBool(value: string | boolean | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  }
}