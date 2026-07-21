import {
  buildMyFinishedEntries,
  buildSpieltagRankingRows,
} from './spieltag-views.util';
import { Game } from '../types/game.interface';
import { Tip } from '../types/tip.interface';
import { TeamOrigin } from '../../teams/types/team.interface';

describe('spieltag-views util', () => {
  it('buildMyFinishedEntries should only create logged-in user entries from provided user tip map', () => {
    const finishedGames: Game[] = [
      {
        id: 'g1',
        homeTeamId: 'h1',
        awayTeamId: 'a1',
        kickoffTime: new Date('2026-02-01T12:00:00.000Z'),
        roundId: 'r1',
        homeScore: 2,
        awayScore: 1,
        isClosed: true,
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
        homeTeam: {
          id: 'h1',
          name: 'BVB',
          shortName: 'BVB',
          logoUrl: '',
          origin: TeamOrigin.GERMANY,
          createdAt: new Date('2026-01-01T12:00:00.000Z'),
        },
        awayTeam: {
          id: 'a1',
          name: 'Arsenal',
          shortName: 'ARS',
          logoUrl: '',
          origin: TeamOrigin.ENGLAND,
          createdAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      },
      {
        id: 'g2',
        homeTeamId: 'h2',
        awayTeamId: 'a2',
        kickoffTime: new Date('2026-02-02T12:00:00.000Z'),
        roundId: 'r1',
        homeScore: 1,
        awayScore: 1,
        isClosed: true,
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
        homeTeam: {
          id: 'h2',
          name: 'Juventus',
          shortName: 'JUV',
          logoUrl: '',
          origin: TeamOrigin.ITALY,
          createdAt: new Date('2026-01-01T12:00:00.000Z'),
        },
        awayTeam: {
          id: 'a2',
          name: 'Inter',
          shortName: 'INT',
          logoUrl: '',
          origin: TeamOrigin.ITALY,
          createdAt: new Date('2026-01-01T12:00:00.000Z'),
        },
      },
    ];

    const myTips = new Map<string, Tip>([
      [
        'g1',
        {
          gameId: 'g1',
          championshipId: 'c1',
          userId: 1,
          homeTeamGoals: 2,
          awayTeamGoals: 1,
          points: 3,
          outcomeType: 'exact',
        },
      ],
    ]);

    const entries = buildMyFinishedEntries(finishedGames, myTips);

    expect(entries.length).toBe(2);
    expect(entries[0].homeTeamName).toBe('BVB');
    expect(entries[0].awayTeamName).toBe('Arsenal');
    expect(entries[0].userTip).toBe('2 : 1');
    expect(entries[0].points).toBe(3);
    expect(entries[1].userTip).toBe('-');
    expect(entries[1].points).toBe(0);
  });

  it('buildSpieltagRankingRows should sum points and sort by total desc then username', () => {
    const finishedGames: Game[] = [
      {
        id: 'g1',
        homeTeamId: 'h1',
        awayTeamId: 'a1',
        kickoffTime: new Date('2026-02-01T12:00:00.000Z'),
        roundId: 'r1',
        homeScore: 2,
        awayScore: 1,
        isClosed: true,
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      },
      {
        id: 'g2',
        homeTeamId: 'h2',
        awayTeamId: 'a2',
        kickoffTime: new Date('2026-02-02T12:00:00.000Z'),
        roundId: 'r1',
        homeScore: 1,
        awayScore: 1,
        isClosed: true,
        createdAt: new Date('2026-01-01T12:00:00.000Z'),
      },
    ];

    const tipsByGame = new Map<string, Tip[]>([
      [
        'g1',
        [
          {
            gameId: 'g1',
            championshipId: 'c1',
            userId: 1,
            homeTeamGoals: 2,
            awayTeamGoals: 1,
            points: 3,
            outcomeType: 'exact',
            user: { id: 1, username: 'Richi', email: '' },
          },
          {
            gameId: 'g1',
            championshipId: 'c1',
            userId: 2,
            homeTeamGoals: 1,
            awayTeamGoals: 1,
            points: 1,
            outcomeType: 'tendency',
            user: { id: 2, username: 'Dima', email: '' },
          },
          {
            gameId: 'g1',
            championshipId: 'c1',
            userId: 5,
            homeTeamGoals: 1,
            awayTeamGoals: 1,
            points: 1,
            outcomeType: 'tendency',
            user: { id: 5, username: 'Igor', email: '' },
          },
        ],
      ],
      [
        'g2',
        [
          {
            gameId: 'g2',
            championshipId: 'c1',
            userId: 1,
            homeTeamGoals: 0,
            awayTeamGoals: 0,
            points: 2,
            outcomeType: 'goalDiff',
            user: { id: 1, username: 'Richi', email: '' },
          },
          {
            gameId: 'g2',
            championshipId: 'c1',
            userId: 3,
            homeTeamGoals: 1,
            awayTeamGoals: 1,
            points: 3,
            outcomeType: 'exact',
            user: { id: 3, username: 'Mischa', email: '' },
          },
        ],
      ],
    ]);

    const participants = [
      { userId: 1, username: 'Richi' },
      { userId: 2, username: 'Dima' },
      { userId: 3, username: 'Mischa' },
      { userId: 4, username: 'Ivan' },
      { userId: 5, username: 'Igor' },
    ];

    const rows = buildSpieltagRankingRows(finishedGames, tipsByGame, participants);

    expect(rows.map((row) => row.username)).toEqual([
      'Richi',
      'Mischa',
      'Dima',
      'Igor',
      'Ivan',
    ]);
    expect(rows.map((row) => row.gamePoints)).toEqual([5, 3, 1, 1, 0]);
    expect(rows.map((row) => row.place)).toEqual([1, 2, 3, 3, 5]);
  });
});
