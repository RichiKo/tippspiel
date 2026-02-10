import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class UpdateEliminatedTeamsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID(4, { each: true })
  teamIds: string[];

  @IsBoolean()
  isEliminated: boolean;
}
