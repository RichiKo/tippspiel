import { IsString, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoundDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;
}
