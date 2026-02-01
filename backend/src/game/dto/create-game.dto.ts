import { IsUUID, IsDate, Validate } from 'class-validator';
import { Type } from 'class-transformer';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'differentTeams', async: false })
export class DifferentTeamsValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    return object.homeTeamId !== object.awayTeamId;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Home team and away team must be different';
  }
}

export class CreateGameDto {
  @IsUUID()
  homeTeamId: string;

  @IsUUID()
  awayTeamId: string;

  @IsDate()
  @Type(() => Date)
  kickoffTime: Date;

  @Validate(DifferentTeamsValidator)
  get teamsAreDifferent(): boolean {
    return this.homeTeamId !== this.awayTeamId;
  }
}
