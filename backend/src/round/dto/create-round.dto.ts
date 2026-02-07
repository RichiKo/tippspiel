import { IsString, MaxLength, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoundDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
