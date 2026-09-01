import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserStatus } from '@prisma/client';
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
  status: true,
  emailVerified: true,
  firstName: true,
  lastName: true,
  phone: true,
  data: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  roles: {
    orderBy: { role: { name: 'asc' } },
    select: {
      role: { select: { id: true, name: true, description: true } },
    },
  },
} as const;

type RoleConnection = {
  role: { id: string; name: string; description: string | null };
};

type SerializedUser = {
  id: string;
  email: string;
  status: UserStatus;
  emailVerified: boolean;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  data: Prisma.JsonValue | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  roles: RoleConnection[];
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email is already in use.');
    }

    const roleIds = await this.validateRoleIds(dto.roleIds ?? []);
    const passwordHash = await hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        data: (dto.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        status: dto.status ?? UserStatus.ACTIVE,
        emailVerified: this.parseBool(dto.emailVerified) ?? false,
        roles:
          roleIds.length > 0
            ? { create: roleIds.map((roleId) => ({ roleId })) }
            : undefined,
      },
      select: PUBLIC_SELECT,
    });

    return this.serializeUser(user);
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
      where.roles = { some: { role: { name: { equals: query.role } } } };
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
      data: items.map((u) => this.serializeUser(u)),
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

    return this.serializeUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const user = await this.ensureExists(id);

    // Prevent admins from removing their own last/senior access.
    if (id === actor.id && dto.roleIds !== undefined) {
      const currentNames = await this.getRoleNames(id);
      if (currentNames.includes('ADMIN')) {
        const newNames = await this.resolveRoleNames(dto.roleIds);
        if (!newNames.includes('ADMIN')) {
          throw new BadRequestException(
            'You cannot remove all ADMIN roles from your own account.',
          );
        }
      }
    }

    if (id === actor.id && dto.status && dto.status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const roleIds =
      dto.roleIds !== undefined
        ? await this.validateRoleIds(dto.roleIds)
        : undefined;

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        status: dto.status,
        data:
          dto.data !== undefined
            ? ((dto.data ?? Prisma.JsonNull) as Prisma.InputJsonValue)
            : undefined,
        emailVerified:
          dto.emailVerified !== undefined
            ? this.parseBool(dto.emailVerified)
            : undefined,
        ...(roleIds !== undefined
          ? {
              roles: {
                deleteMany: {},
                create: roleIds.map((roleId) => ({ roleId })),
              },
            }
          : {}),
      },
      select: PUBLIC_SELECT,
    });

    return this.serializeUser(updated);
  }

  async setStatus(id: string, status: UserStatus, actor: AuthUser) {
    if (id === actor.id && status !== UserStatus.ACTIVE) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }
    await this.ensureExists(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: PUBLIC_SELECT,
    });
    return this.serializeUser(updated);
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

  private serializeUser(user: SerializedUser) {
    const { roles, ...rest } = user;
    return {
      ...rest,
      roles: roles.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        description: r.role.description,
      })),
    };
  }

  private async getRoleNames(userId: string): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    });
    return rows.map((r) => r.role.name);
  }

  private async validateRoleIds(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];
    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    const validIds = new Set(found.map((r) => r.id));
    const missing = roleIds.filter((id) => !validIds.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Unknown role id(s): ${missing.join(', ')}`,
      );
    }
    return roleIds;
  }

  private async resolveRoleNames(roleIds: string[]): Promise<string[]> {
    if (roleIds.length === 0) return [];
    const found = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { name: true },
    });
    return found.map((r) => r.name);
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
