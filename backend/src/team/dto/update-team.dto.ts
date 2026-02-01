import { PartialType } from '@nestjs/mapped-types';
import { CreateTeamDto } from './create-team.dto';

/**
 * UpdateTeamDto erweitert CreateTeamDto mit PartialType.
 *
 * PartialType macht automatisch ALLE Felder aus CreateTeamDto optional
 * und übernimmt dabei alle Validierungsregeln (@IsString, @MaxLength, etc.).
 *
 * Vorteile:
 * - Keine Code-Duplikation
 * - Änderungen in CreateTeamDto werden automatisch hier übernommen
 * - Standard NestJS Best Practice
 *
 * Äquivalent zu:
 * - name?: string (mit @IsOptional, @IsString, @MaxLength(100))
 * - shortName?: string (mit @IsOptional, @IsString, @MaxLength(10))
 * - logoUrl?: string (mit @IsOptional, @IsString, @IsUrl)
 */
export class UpdateTeamDto extends PartialType(CreateTeamDto) {}
