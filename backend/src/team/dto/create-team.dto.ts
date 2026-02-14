import { IsEnum, IsString, MaxLength } from 'class-validator';
import { TeamOrigin } from '../team-origin.enum';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(10)
  shortName: string;

  @IsString()
  logoUrl: string;

  @IsEnum(TeamOrigin)
  origin: TeamOrigin;
}
