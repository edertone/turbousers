import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role, UserStatus } from '@prisma/client';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  QueryUsersDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserIdParams,
} from './dto/user.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@Param() params: UserIdParams) {
    return this.usersService.findOne(params.id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @Param() params: UserIdParams,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.update(params.id, dto, actor);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  setStatus(
    @Param() params: UserIdParams,
    @Body('status') status: UserStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.setStatus(params.id, status, actor);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/role')
  setRole(
    @Param() params: UserIdParams,
    @Body('role') role: Role,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.setRole(params.id, role, actor);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/password')
  updatePassword(@Param() params: UserIdParams, @Body() dto: UpdatePasswordDto) {
    return this.usersService.updatePassword(params.id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param() params: UserIdParams, @CurrentUser() actor: AuthUser) {
    return this.usersService.remove(params.id, actor);
  }
}