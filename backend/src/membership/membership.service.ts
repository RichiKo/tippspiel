import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipEntity } from './membership.entity';
import { MembershipStatus } from './membership-status.enum';
import { ChampionshipEntity } from '../championship/championship.entity';
import { RankingService } from '../ranking/ranking.service';

@Injectable()
export class MembershipService {
  constructor(
    @InjectRepository(MembershipEntity)
    private readonly membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(ChampionshipEntity)
    private readonly championshipRepository: Repository<ChampionshipEntity>,
    private readonly rankingService: RankingService,
  ) {}

  async joinChampionship(
    userId: number,
    championshipId: string,
  ): Promise<MembershipEntity> {
    // Load championship to check if it's public and active
    const championship = await this.championshipRepository.findOne({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new NotFoundException('Championship not found');
    }

    if (!championship.isActive) {
      throw new BadRequestException('Cannot join inactive championship');
    }

    // Check if membership already exists
    const existingMembership = await this.membershipRepository.findOne({
      where: { userId, championshipId },
    });

    if (existingMembership) {
      // If already ACTIVE, return existing (idempotent)
      if (existingMembership.status === MembershipStatus.ACTIVE) {
        return existingMembership;
      }

      // If PENDING, return existing (already requested)
      if (existingMembership.status === MembershipStatus.PENDING) {
        return existingMembership;
      }

      // If REJECTED, update to PENDING (allow re-request)
      if (existingMembership.status === MembershipStatus.REJECTED) {
        existingMembership.status = MembershipStatus.PENDING;
        return this.membershipRepository.save(existingMembership);
      }
    }

    // Create new membership
    const status = championship.isPublic
      ? MembershipStatus.ACTIVE
      : MembershipStatus.PENDING;

    const membership = this.membershipRepository.create({
      userId,
      championshipId,
      status,
    });

    const savedMembership = await this.membershipRepository.save(membership);

    // If membership is ACTIVE (public championship), create ranking entry
    if (savedMembership.status === MembershipStatus.ACTIVE) {
      await this.rankingService.ensureRankingExistsForUser(
        userId,
        championshipId,
      );
    }

    return savedMembership;
  }

  async getMembershipStatus(
    userId: number,
    championshipId: string,
  ): Promise<MembershipEntity | null> {
    return this.membershipRepository.findOne({
      where: { userId, championshipId },
    });
  }

  async getUserMemberships(userId: number): Promise<MembershipEntity[]> {
    return this.membershipRepository.find({
      where: { userId },
      relations: ['championship'],
      order: { createdAt: 'DESC' },
    });
  }

  async getChampionshipMembers(
    championshipId: string,
    status?: MembershipStatus,
  ): Promise<MembershipEntity[]> {
    const where: { championshipId: string; status?: MembershipStatus } = {
      championshipId,
    };

    if (status) {
      where.status = status;
    }

    return this.membershipRepository.find({
      where,
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async getPendingMemberships(
    championshipId: string,
  ): Promise<MembershipEntity[]> {
    return this.getChampionshipMembers(
      championshipId,
      MembershipStatus.PENDING,
    );
  }

  async updateMembershipStatus(
    membershipId: string,
    status: MembershipStatus,
  ): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId },
      relations: ['user'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // Validate status transition
    if (
      membership.status === MembershipStatus.ACTIVE &&
      status === MembershipStatus.PENDING
    ) {
      throw new BadRequestException(
        'Cannot change ACTIVE membership to PENDING',
      );
    }

    const oldStatus = membership.status;
    membership.status = status;
    const updatedMembership = await this.membershipRepository.save(membership);

    // If status changed to ACTIVE (admin approval), create ranking entry
    if (
      oldStatus !== MembershipStatus.ACTIVE &&
      status === MembershipStatus.ACTIVE
    ) {
      await this.rankingService.ensureRankingExistsForUser(
        updatedMembership.userId,
        updatedMembership.championshipId,
      );
    }

    return updatedMembership;
  }

  async removeMembership(membershipId: string): Promise<void> {
    const result = await this.membershipRepository.delete(membershipId);

    if (result.affected === 0) {
      throw new NotFoundException('Membership not found');
    }
  }
}
