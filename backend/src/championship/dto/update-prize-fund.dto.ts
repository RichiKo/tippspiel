import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsArray,
  ArrayMinSize,
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PrizeFundTieMode } from '../types/prize-fund';

export class PrizeFundRuleDto {
  @IsIn(['share_equal_points', 'tie_breakers'])
  tieMode: PrizeFundTieMode;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Matches(/^(0|[1-9]\d*)$/, { each: true })
  prizeAmountsMinorUnits: string[];
}

export class UpdatePrizeFundDto {
  @IsString()
  @Matches(/^(0|[1-9]\d*)$/)
  @MaxLength(19)
  entryFeeMinorUnits: string;

  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => PrizeFundRuleDto)
  prizeFundRule: PrizeFundRuleDto;
}
