import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { NotificationType } from '../notification.types';

class SubscriptionKeysDto {
  @IsString() @MaxLength(128) p256dh: string;
  @IsString() @MaxLength(64) auth: string;
}

export class RegisterSubscriptionDto {
  @IsString() @MaxLength(2048) endpoint: string;
  @IsDefined()
  @ValidateNested()
  @Type(() => SubscriptionKeysDto)
  keys: SubscriptionKeysDto;
  @IsOptional() @IsIn(['uk', 'de']) locale?: string;
}

export class SendNotificationDto {
  @IsIn(['new_round', 'round_results']) type: NotificationType;
  @IsUUID('4') requestId: string;
}
