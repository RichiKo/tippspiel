import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { BonusService } from './bonus.service';
import { CreateBonusRuleDto } from './dto/create-bonus-rule.dto';
import { UpdateBonusRuleDto } from './dto/update-bonus-rule.dto';
import { CreateBonusPickDto } from './dto/create-bonus-pick.dto';
import { EvaluateBonusDto } from './dto/evaluate-bonus.dto';
import { BonusRuleEntity } from './bonus-rule.entity';
import { BonusPickEntity } from './bonus-pick.entity';
import { AuthGuard } from '../guards/auth.guard';
import { User } from '../user/decoratos/user.decorator';
import { BonusAdminGuard } from './guards/bonus-admin.guard';
import { BonusRuleStatus } from './bonus-rule-status.enum';

@Controller()
export class BonusController {
  constructor(private readonly bonusService: BonusService) {}

  // ========== Admin Endpoints ==========

  @Post('championships/:championshipId/bonus-rules')
  @UseGuards(AuthGuard, BonusAdminGuard)
  @UsePipes(new ValidationPipe())
  async createBonusRule(
    @Body() createDto: CreateBonusRuleDto,
  ): Promise<BonusRuleEntity> {
    return this.bonusService.createBonusRule(createDto);
  }

  @Get('championships/:championshipId/bonus-rules')
  @UseGuards(AuthGuard, BonusAdminGuard)
  async getBonusRules(
    @Param('championshipId') championshipId: string,
    @Query('status') status?: BonusRuleStatus,
  ): Promise<BonusRuleEntity[]> {
    return this.bonusService.getBonusRules(championshipId, status);
  }

  @Patch('bonus-rules/:id')
  @UseGuards(AuthGuard, BonusAdminGuard)
  @UsePipes(new ValidationPipe())
  async updateBonusRule(
    @Param('id') id: string,
    @Body() updateDto: UpdateBonusRuleDto,
  ): Promise<BonusRuleEntity> {
    return this.bonusService.updateBonusRule(id, updateDto);
  }

  @Patch('bonus-rules/:id/publish')
  @UseGuards(AuthGuard, BonusAdminGuard)
  async publishBonusRule(@Param('id') id: string): Promise<BonusRuleEntity> {
    return this.bonusService.publishBonusRule(id);
  }

  @Delete('bonus-rules/:id')
  @UseGuards(AuthGuard, BonusAdminGuard)
  async deleteBonusRule(@Param('id') id: string): Promise<void> {
    return this.bonusService.deleteBonusRule(id);
  }

  @Post('bonus-rules/:id/evaluate')
  @UseGuards(AuthGuard, BonusAdminGuard)
  @UsePipes(new ValidationPipe())
  async evaluateBonus(
    @Param('id') id: string,
    @Body() evaluateDto: EvaluateBonusDto,
  ): Promise<{ evaluationsCreated: number }> {
    return this.bonusService.evaluateBonus(id, evaluateDto);
  }

  @Get('bonus-rules/:id/picks')
  @UseGuards(AuthGuard, BonusAdminGuard)
  async getAllPicksAdmin(@Param('id') id: string): Promise<BonusPickEntity[]> {
    return this.bonusService.getAllPicks(id, undefined, true);
  }

  @Get('bonus-rules/:id/evaluation-result')
  @UseGuards(AuthGuard, BonusAdminGuard)
  async getEvaluationResult(
    @Param('id') id: string,
  ): Promise<{
    phase: 'none' | 'finalists_done' | 'complete';
    championTeamId?: string;
    finalistTeamIds: string[];
  }> {
    return this.bonusService.getEvaluationResult(id);
  }

  // ========== User Endpoints ==========

  @Get('championships/:championshipId/bonus-rules/active')
  @UseGuards(AuthGuard)
  async getActiveBonusRules(
    @Param('championshipId') championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    return this.bonusService.getActiveBonusRules(championshipId);
  }

  @Post('bonus-rules/:id/pick')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  async createOrUpdatePick(
    @Param('id') id: string,
    @User('id') userId: number,
    @Body() createPickDto: CreateBonusPickDto,
  ): Promise<BonusPickEntity> {
    return this.bonusService.createOrUpdatePick(
      id,
      userId,
      createPickDto.teamId,
    );
  }

  @Get('bonus-rules/:id/my-pick')
  @UseGuards(AuthGuard)
  async getMyPick(
    @Param('id') id: string,
    @User('id') userId: number,
  ): Promise<BonusPickEntity | null> {
    return this.bonusService.getMyPick(id, userId);
  }

  @Get('bonus-rules/:id/all-picks')
  @UseGuards(AuthGuard)
  async getAllPicksUser(
    @Param('id') id: string,
    @User('id') userId: number,
  ): Promise<BonusPickEntity[]> {
    return this.bonusService.getAllPicks(id, userId, false);
  }

  @Get('championships/:championshipId/bonus-rules/evaluated')
  @UseGuards(AuthGuard)
  async getEvaluatedBonusRules(
    @Param('championshipId') championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    return this.bonusService.getEvaluatedBonusRules(championshipId);
  }

  @Get('championships/:championshipId/bonus-rules/overview')
  @UseGuards(AuthGuard)
  async getBonusRulesForOverview(
    @Param('championshipId') championshipId: string,
  ): Promise<BonusRuleEntity[]> {
    return this.bonusService.getBonusRulesForOverview(championshipId);
  }
}
