import { PartialType } from '@nestjs/mapped-types';
import { CreateBonusRuleDto } from './create-bonus-rule.dto';

export class UpdateBonusRuleDto extends PartialType(CreateBonusRuleDto) {}
