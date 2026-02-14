import { IsEnum, IsOptional } from 'class-validator';
import { TeamOrigin } from '../team-origin.enum';

export class TeamFilterDto {
  @IsOptional()
  @IsEnum(TeamOrigin)
  origin?: TeamOrigin;
}

