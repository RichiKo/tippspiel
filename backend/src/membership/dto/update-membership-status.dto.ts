import { IsEnum } from 'class-validator';
import { MembershipStatus } from '../membership-status.enum';

export class UpdateMembershipStatusDto {
  @IsEnum(MembershipStatus)
  status: MembershipStatus;
}
