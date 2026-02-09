export interface Ranking {
  id: string;
  userId: number;
  championshipId: string;
  rank: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  missedTips: number;
  totalPoints: number;
  updatedAt: Date;
  user: {
    id: number;
    username: string;
    email: string;
  };
}
