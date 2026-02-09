import {
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class EvaluateBonusDto {
  @IsOptional()
  @IsUUID()
  championTeamId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsUUID('4', { each: true })
  finalistTeamIds?: string[];
}
