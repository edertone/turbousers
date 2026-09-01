import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesService } from './roles.service';
import {
  AssignRolesDto,
  CreateRoleDto,
  RoleIdParams,
  UpdateRoleDto,
  UserIdParam,
} from './dto/role.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param() params: RoleIdParams) {
    return this.rolesService.findOne(params.id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  update(@Param() params: RoleIdParams, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(params.id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param() params: RoleIdParams) {
    return this.rolesService.remove(params.id);
  }

  @Roles('ADMIN')
  @Get('users/:userId')
  getUserRoles(@Param() params: UserIdParam) {
    return this.rolesService.getUserRoles(params.userId);
  }

  @Roles('ADMIN')
  @Patch('users/:userId')
  assignToUser(@Param() params: UserIdParam, @Body() dto: AssignRolesDto) {
    return this.rolesService.assignToUser(params.userId, dto);
  }

  @Roles('ADMIN')
  @Delete('users/:userId/:roleId')
  removeFromUser(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.rolesService.removeFromUser(userId, roleId);
  }
}
