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
import { UserStatus } from '@prisma/client';
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
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Roles('ADMIN')
  @Get()
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param() params: UserIdParams) {
    return this.usersService.findOne(params.id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(
    @Param() params: UserIdParams,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.update(params.id, dto, actor);
  }

  @Roles('ADMIN')
  @Patch(':id/status')
  setStatus(
    @Param() params: UserIdParams,
    @Body('status') status: UserStatus,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.usersService.setStatus(params.id, status, actor);
  }

  @Roles('ADMIN')
  @Patch(':id/password')
  updatePassword(
    @Param() params: UserIdParams,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(params.id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param() params: UserIdParams, @CurrentUser() actor: AuthUser) {
    return this.usersService.remove(params.id, actor);
  }
}
