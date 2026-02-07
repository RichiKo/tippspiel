import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RankingEntity } from './ranking.entity';
import { TipEntity } from '../tip/tip.entity';
import { TipOutcome } from '../tip/tip-outcome.enum';
import { ChampionshipEntity } from '../championship/championship.entity';

interface UserRankingData {
  userId: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  missedTips: number;
  totalPoints: number;
}

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(RankingEntity)
    private readonly rankingRepository: Repository<RankingEntity>,
    @InjectRepository(TipEntity)
    private readonly tipRepository: Repository<TipEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
  ) {}

  async recalculateForChampionship(championshipId: string): Promise<void> {
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    const tips = await this.tipRepository.find({
      where: { championshipId },
      relations: ['user'],
    });

    const userDataMap = new Map<number, UserRankingData>();

    for (const tip of tips) {
      if (!userDataMap.has(tip.userId)) {
        userDataMap.set(tip.userId, {
          userId: tip.userId,
          exactHits: 0,
          goalDiffHits: 0,
          tendencyHits: 0,
          missedTips: 0,
          totalPoints: 0,
        });
      }

      const userData = userDataMap.get(tip.userId)!;

      if (tip.outcomeType === TipOutcome.EXACT) {
        userData.exactHits++;
        userData.totalPoints += 3;
      } else if (tip.outcomeType === TipOutcome.GOAL_DIFF) {
        userData.goalDiffHits++;
        userData.totalPoints += 2;
      } else if (tip.outcomeType === TipOutcome.TENDENCY) {
        userData.tendencyHits++;
        userData.totalPoints += 1;
      } else if (tip.outcomeType === TipOutcome.MISSED) {
        userData.missedTips++;
      } else if (tip.outcomeType === TipOutcome.NOT_TIPPED) {
        userData.missedTips++;
      }
    }

    const sortedUsers = Array.from(userDataMap.values()).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.exactHits !== a.exactHits) {
        return b.exactHits - a.exactHits;
      }
      if (b.goalDiffHits !== a.goalDiffHits) {
        return b.goalDiffHits - a.goalDiffHits;
      }
      return b.tendencyHits - a.tendencyHits;
    });

    for (let i = 0; i < sortedUsers.length; i++) {
      const userData = sortedUsers[i];
      const rank = i + 1;

      const existingRanking = await this.rankingRepository.findOne({
        where: { userId: userData.userId, championshipId },
      });

      if (existingRanking) {
        existingRanking.rank = rank;
        existingRanking.exactHits = userData.exactHits;
        existingRanking.goalDiffHits = userData.goalDiffHits;
        existingRanking.tendencyHits = userData.tendencyHits;
        existingRanking.missedTips = userData.missedTips;
        await this.rankingRepository.save(existingRanking);
      } else {
        const newRanking = this.rankingRepository.create({
          userId: userData.userId,
          championshipId,
          rank,
          exactHits: userData.exactHits,
          goalDiffHits: userData.goalDiffHits,
          tendencyHits: userData.tendencyHits,
          missedTips: userData.missedTips,
        });
        await this.rankingRepository.save(newRanking);
      }
    }
  }

  async findByChampionship(championshipId: string): Promise<RankingEntity[]> {
    return this.rankingRepository.find({
      where: { championshipId },
      relations: ['user'],
      order: { rank: 'ASC' },
    });
  }
}
