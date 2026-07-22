import { Game } from '../types/game.interface';
import { Tip } from '../types/tip.interface';

export type SpieltagViewMode = 'myGames' | 'allGames' | 'table';

export interface GameGroup {
  date: Date;
  games: Game[];
}

export interface RankingParticipant {
  userId: number;
  username: string;
}

export interface MyFinishedEntry {
  gameId: string;
  kickoffTime: Date;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  finalScore: string;
  userTip: string;
  points: number;
}

export interface SpieltagRankingRow {
  place: number;
  userId: number;
  username: string;
  gamePoints: number;
  total: number;
}

export function isFinishedGame(game: Game): boolean {
  return game.isClosed && game.homeScore !== null && game.awayScore !== null;
}

export function groupGamesByDate(games: Game[]): GameGroup[] {
  const grouped = new Map<string, { date: Date; games: Game[] }>();

  for (const game of games) {
    const kickoffDate = new Date(game.kickoffTime);
    const dateKey = kickoffDate.toDateString();

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, { date: kickoffDate, games: [] });
    }

    grouped.get(dateKey)?.games.push(game);
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((group) => ({
      date: group.date,
      games: group.games.sort(
        (a, b) =>
          new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime(),
      ),
    }));
}

export function buildMyFinishedEntries(
  finishedGames: Game[],
  userTipsByGame: Map<string, Tip>,
): MyFinishedEntry[] {
  return finishedGames
    .slice()
    .sort(
      (a, b) =>
        new Date(a.kickoffTime).getTime() - new Date(b.kickoffTime).getTime(),
    )
    .map((game) => {
      const tip = userTipsByGame.get(game.id);
      const homeName = game.homeTeam?.name ?? `Team ${game.homeTeamId}`;
      const awayName = game.awayTeam?.name ?? `Team ${game.awayTeamId}`;

      return {
        gameId: game.id,
        kickoffTime: new Date(game.kickoffTime),
        homeTeamName: homeName,
        awayTeamName: awayName,
        homeTeamLogoUrl: game.homeTeam?.logoUrl ?? null,
        awayTeamLogoUrl: game.awayTeam?.logoUrl ?? null,
        finalScore: `${game.homeScore} : ${game.awayScore}`,
        userTip:
          tip && tip.homeTeamGoals !== null && tip.awayTeamGoals !== null
            ? `${tip.homeTeamGoals} : ${tip.awayTeamGoals}`
            : '-',
        points: tip?.points ?? 0,
      };
    });
}

export function buildSpieltagRankingRows(
  finishedGames: Game[],
  tipsByGame: Map<string, Tip[]>,
  rankingParticipants: RankingParticipant[],
): SpieltagRankingRow[] {
  const participantMap = new Map<number, RankingParticipant>();

  for (const participant of rankingParticipants) {
    if (!participantMap.has(participant.userId)) {
      participantMap.set(participant.userId, participant);
    }
  }

  for (const game of finishedGames) {
    const gameTips = tipsByGame.get(game.id) ?? [];
    for (const tip of gameTips) {
      if (!participantMap.has(tip.userId)) {
        participantMap.set(tip.userId, {
          userId: tip.userId,
          username: tip.user?.username ?? `User ${tip.userId}`,
        });
      }
    }
  }

  const rows = Array.from(participantMap.values()).map((participant) => {
    let gamePoints = 0;

    for (const game of finishedGames) {
      const gameTips = tipsByGame.get(game.id) ?? [];
      const participantTip = gameTips.find((tip) => tip.userId === participant.userId);
      gamePoints += participantTip?.points ?? 0;
    }

    return {
      place: 0,
      userId: participant.userId,
      username: participant.username,
      gamePoints,
      total: gamePoints,
    };
  });

  rows.sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }

    if (b.gamePoints !== a.gamePoints) {
      return b.gamePoints - a.gamePoints;
    }

    return a.username.localeCompare(b.username);
  });

  let currentPlace = 0;
  let previousTotal: number | null = null;

  return rows.map((row, index) => {
    if (row.total !== previousTotal) {
      currentPlace = index + 1;
    }
    previousTotal = row.total;

    return {
      ...row,
      place: currentPlace,
    };
  });
}
