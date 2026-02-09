import { IsString } from 'class-validator';

export class CreateBonusPickDto {
  @IsString()
  teamId: string;
}
