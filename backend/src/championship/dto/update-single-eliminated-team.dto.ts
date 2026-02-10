import { IsBoolean } from 'class-validator';

export class UpdateSingleEliminatedTeamDto {
  @IsBoolean()
  isEliminated: boolean;
}
