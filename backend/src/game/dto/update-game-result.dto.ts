import { IsInt, Min, IsBoolean, IsOptional } from 'class-validator';

export class UpdateGameResultDto {
  @IsInt()
  @Min(0)
  homeScore: number;

  @IsInt()
  @Min(0)
  awayScore: number;

  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;
}
