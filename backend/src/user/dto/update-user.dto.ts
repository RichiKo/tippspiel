import {
  IsEmail,
  IsEnum,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';
import { UserRole } from '@app/user/user-rolle.enum';

export class UpdateUserDto {
  @IsOptional()
  @MaxLength(30)
  readonly username?: string;

  @IsOptional()
  @IsEmail()
  readonly email?: string;

  @IsOptional()
  @MinLength(6)
  readonly password?: string;

  @IsOptional()
  readonly image?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
