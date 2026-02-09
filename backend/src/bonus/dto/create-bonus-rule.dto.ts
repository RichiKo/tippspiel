import {
  IsString,
  IsEnum,
  IsObject,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { BonusRuleType } from '../bonus-rule-type.enum';
import { BonusRuleConfig } from '../bonus-rule-config.interface';

export class CreateBonusRuleDto {
  @IsString()
  championshipId: string;

  @IsEnum(BonusRuleType)
  type: BonusRuleType;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsObject()
  config: BonusRuleConfig;

  @IsDateString()
  deadline: string;
}
