export enum TeamOrigin {
  ENGLAND = 'ENGLAND',
  GERMANY = 'GERMANY',
  SPAIN = 'SPAIN',
  ITALY = 'ITALY',
  FRANCE = 'FRANCE',
  NATIONAL = 'NATIONAL',
  OTHER = 'OTHER',
}

export const TEAM_ORIGIN_OPTIONS: readonly TeamOrigin[] = [
  TeamOrigin.ENGLAND,
  TeamOrigin.GERMANY,
  TeamOrigin.SPAIN,
  TeamOrigin.ITALY,
  TeamOrigin.FRANCE,
  TeamOrigin.NATIONAL,
  TeamOrigin.OTHER,
] as const;

export const TEAM_ORIGIN_LABELS: Record<TeamOrigin, string> = {
  [TeamOrigin.ENGLAND]: 'England',
  [TeamOrigin.GERMANY]: 'Deutschland',
  [TeamOrigin.SPAIN]: 'Spanien',
  [TeamOrigin.ITALY]: 'Italien',
  [TeamOrigin.FRANCE]: 'Frankreich',
  [TeamOrigin.NATIONAL]: 'Nationalmannschaft',
  [TeamOrigin.OTHER]: 'Andere',
};

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  origin: TeamOrigin;
  createdAt: Date;
}
