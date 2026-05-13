import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class ArchiveWinnerDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  manualName?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  points: number;
}
