export interface Tip {
  id?: string;
  userId: number;
  gameId: string;
  championshipId: string;
  homeTeamGoals: number | null;
  awayTeamGoals: number | null;
  points: number | null;
  outcomeType: 'exact' | 'goalDiff' | 'tendency' | 'missed' | 'notTipped' | null;
  createdAt?: Date;
  updatedAt?: Date;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface CreateTipDto {
  gameId: string;
  championshipId: string;
  homeTeamGoals: number;
  awayTeamGoals: number;
}
