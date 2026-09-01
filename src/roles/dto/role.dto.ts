import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Role name can only contain letters, numbers, underscore and dash.',
  })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message:
      'Role name can only contain letters, numbers, underscore and dash.',
  })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class AssignRolesDto {
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  roleIds!: string[];
}

export class RoleIdParams {
  @IsUUID()
  id!: string;
}

export class UserIdParam {
  @IsUUID()
  userId!: string;
}
