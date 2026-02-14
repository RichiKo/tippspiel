import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateTeamDto } from './create-team.dto';
import { TeamFilterDto } from './team-filter.dto';
import { TeamOrigin } from '../team-origin.enum';

describe('Team DTO Validation', () => {
  it('should validate create team dto with valid origin enum', () => {
    const dto = plainToInstance(CreateTeamDto, {
      name: 'Arsenal FC',
      shortName: 'ARS',
      logoUrl: '/uploads/teams/arsenal.png',
      origin: TeamOrigin.ENGLAND,
    });

    const errors = validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail create team dto when origin enum is invalid', () => {
    const dto = plainToInstance(CreateTeamDto, {
      name: 'Arsenal FC',
      shortName: 'ARS',
      logoUrl: '/uploads/teams/arsenal.png',
      origin: 'INVALID_ORIGIN',
    });

    const errors = validateSync(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((error) => error.property === 'origin')).toBe(true);
  });

  it('should validate team filter dto origin query', () => {
    const dto = plainToInstance(TeamFilterDto, {
      origin: TeamOrigin.GERMANY,
    });

    const errors = validateSync(dto);
    expect(errors.length).toBe(0);
  });
});

