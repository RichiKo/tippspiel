import { IsEmail, IsEnum, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '@app/user/user-rolle.enum';

export class UpdateUserDto {
  @MaxLength(30)
  readonly username: string;

  @IsEmail()
  readonly email: string;

  @MinLength(6)
  readonly password: string;
  readonly image: string;

  @IsEnum(UserRole)
  role: UserRole;
}
