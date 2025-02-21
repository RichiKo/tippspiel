import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@app/user/user-rolle.enum';

export class CreateUserDto {
  @IsNotEmpty()
  @MaxLength(30)
  readonly username: string;

  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(6)
  readonly password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole;
}
