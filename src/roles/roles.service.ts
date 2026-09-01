import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRolesDto, CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

const PUBLIC_SELECT = {
  id: true,
  name: true,
  description: true,
  data: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.role.findUnique({ where: { name } });
    if (existing) {
      throw new BadRequestException(`Role "${name}" already exists.`);
    }

    return this.prisma.role.create({
      data: {
        name,
        description: dto.description,
        data: (dto.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
      select: PUBLIC_SELECT,
    });
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: PUBLIC_SELECT,
    });

    const counts = await this.prisma.userRole.groupBy({
      by: ['roleId'],
      _count: { _all: true },
    });
    const countByRole = Object.fromEntries(
      counts.map((c) => [c.roleId, c._count._all]),
    );

    return roles.map((role) => ({
      ...role,
      userCount: countByRole[role.id] ?? 0,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      select: {
        ...PUBLIC_SELECT,
        users: {
          select: { userId: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    const { users, ...rest } = role;
    return {
      ...rest,
      userCount: users.length,
      userIds: users.map((u) => u.userId),
    };
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.ensureExists(id);

    if (dto.name) {
      const name = dto.name.trim();
      const clash = await this.prisma.role.findFirst({
        where: { name, NOT: { id } },
      });
      if (clash) {
        throw new BadRequestException(`Role "${name}" already exists.`);
      }
      dto.name = name;
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        data:
          dto.data !== undefined
            ? ((dto.data ?? Prisma.JsonNull) as Prisma.InputJsonValue)
            : undefined,
      },
      select: PUBLIC_SELECT,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);

    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });
    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${userCount} user(s) are still assigned to it.`,
      );
    }

    await this.prisma.role.delete({ where: { id } });
    return { success: true, id };
  }

  // -------- User role assignment --------

  async assignToUser(userId: string, dto: AssignRolesDto) {
    await this.ensureUserExists(userId);
    const roleIds = [...new Set(dto.roleIds)];
    const validIds = new Set(
      await this.prisma.role
        .findMany({
          where: { id: { in: roleIds } },
          select: { id: true },
        })
        .then((rows) => rows.map((r) => r.id)),
    );

    const invalid = roleIds.filter((id) => !validIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Unknown role id(s): ${invalid.join(', ')}`,
      );
    }

    // Replace the full set of roles: remove any roles not in the new list,
    // then (re)create the requested assignments.
    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId } });
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId, roleId })),
          skipDuplicates: true,
        });
      }
    });

    return this.getUserRoles(userId);
  }

  async removeFromUser(userId: string, roleId: string) {
    await this.ensureUserExists(userId);
    await this.ensureExists(roleId);
    await this.prisma.userRole.deleteMany({
      where: { userId, roleId },
    });
    return this.getUserRoles(userId);
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        roles: {
          orderBy: { role: { name: 'asc' } },
          select: {
            roleId: true,
            createdAt: true,
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user.roles.map((r) => ({
      id: r.role.id,
      name: r.role.name,
      assignedAt: r.createdAt,
    }));
  }

  private async ensureExists(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found.');
    }
    return role;
  }

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }
}
