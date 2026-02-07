import { IsInt, Min, IsUUID } from 'class-validator';

export class CreateTipDto {
  @IsUUID()
  gameId: string;

  @IsUUID()
  championshipId: string;

  @IsInt()
  @Min(0)
  homeTeamGoals: number;

  @IsInt()
  @Min(0)
  awayTeamGoals: number;
}
