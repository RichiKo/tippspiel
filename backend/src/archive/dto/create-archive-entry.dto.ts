import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ArchiveWinnerDto } from './archive-winner.dto';

export class CreateArchiveEntryDto {
  @IsString()
  @MaxLength(120)
  championshipName: string;

  @Type(() => Number)
  @IsInt()
  @Min(1900)
  year: number;

  @ValidateNested()
  @Type(() => ArchiveWinnerDto)
  firstPlace: ArchiveWinnerDto;

  @ValidateNested()
  @Type(() => ArchiveWinnerDto)
  secondPlace: ArchiveWinnerDto;

  @ValidateNested()
  @Type(() => ArchiveWinnerDto)
  thirdPlace: ArchiveWinnerDto;
}
