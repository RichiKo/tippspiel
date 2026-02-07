import { IsInt, Min, IsOptional } from 'class-validator';

export class UpdateTipDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  homeTeamGoals?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  awayTeamGoals?: number;
}
