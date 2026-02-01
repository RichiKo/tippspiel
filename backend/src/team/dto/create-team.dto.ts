import { IsString, MaxLength, IsUrl } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(10)
  shortName: string;

  @IsString()
  @IsUrl()
  logoUrl: string;
}
