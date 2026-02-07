import { IsUUID, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGameDto {
  @IsOptional()
  @IsUUID()
  homeTeamId?: string;

  @IsOptional()
  @IsUUID()
  awayTeamId?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  kickoffTime?: Date;
}
