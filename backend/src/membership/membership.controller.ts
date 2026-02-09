import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import { MembershipEntity } from './membership.entity';
import { MembershipStatus } from './membership-status.enum';
import { AuthGuard } from '../guards/auth.guard';
import { ChampionshipOwnerGuard } from './guards/championship-owner.guard';
import { User } from '../user/decoratos/user.decorator';

@Controller()
@UseGuards(AuthGuard)
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('championships/:id/join')
  @HttpCode(HttpStatus.OK)
  async joinChampionship(
    @Param('id') championshipId: string,
    @User('id') userId: number,
  ): Promise<{ membership: MembershipEntity; message: string }> {
    const membership = await this.membershipService.joinChampionship(
      userId,
      championshipId,
    );

    const message =
      membership.status === MembershipStatus.ACTIVE
        ? 'Successfully joined championship'
        : 'Request submitted, waiting for approval';

    return { membership, message };
  }

  @Get('championships/:id/membership')
  async getMembership(
    @Param('id') championshipId: string,
    @User('id') userId: number,
  ): Promise<{ membership: MembershipEntity | null }> {
    const membership = await this.membershipService.getMembershipStatus(
      userId,
      championshipId,
    );

    return { membership };
  }

  @Get('championships/:id/members')
  @UseGuards(ChampionshipOwnerGuard)
  async getChampionshipMembers(
    @Param('id') championshipId: string,
    @Query('status') status?: MembershipStatus,
  ): Promise<{ members: MembershipEntity[] }> {
    const members = await this.membershipService.getChampionshipMembers(
      championshipId,
      status,
    );

    return { members };
  }

  @Get('championships/:id/members/pending')
  @UseGuards(ChampionshipOwnerGuard)
  async getPendingMemberships(
    @Param('id') championshipId: string,
  ): Promise<{ pendingRequests: MembershipEntity[] }> {
    const pendingRequests =
      await this.membershipService.getPendingMemberships(championshipId);

    return { pendingRequests };
  }

  @Put('memberships/:membershipId/approve')
  @UseGuards(ChampionshipOwnerGuard)
  async approveMembership(
    @Param('membershipId') membershipId: string,
  ): Promise<{ membership: MembershipEntity }> {
    const membership = await this.membershipService.updateMembershipStatus(
      membershipId,
      MembershipStatus.ACTIVE,
    );

    return { membership };
  }

  @Put('memberships/:membershipId/reject')
  @UseGuards(ChampionshipOwnerGuard)
  async rejectMembership(
    @Param('membershipId') membershipId: string,
  ): Promise<{ membership: MembershipEntity }> {
    const membership = await this.membershipService.updateMembershipStatus(
      membershipId,
      MembershipStatus.REJECTED,
    );

    return { membership };
  }

  @Delete('memberships/:membershipId')
  @UseGuards(ChampionshipOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMembership(
    @Param('membershipId') membershipId: string,
  ): Promise<void> {
    await this.membershipService.removeMembership(membershipId);
  }

  @Get('user/memberships')
  async getUserMemberships(
    @User('id') userId: number,
  ): Promise<{ memberships: MembershipEntity[] }> {
    const memberships = await this.membershipService.getUserMemberships(userId);

    return { memberships };
  }
}
