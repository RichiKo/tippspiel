import { IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(10)
  shortName: string;

  @IsString()
  logoUrl: string;
}
