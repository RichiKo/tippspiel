import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BonusService } from '../../services/bonus.service';
import {
  BonusRule,
  BonusRuleType,
  BonusPick,
  ChampionConfig,
  ChampionFinalistConfig,
} from '../../types/bonus.interface';
import { UI_ICONS, UiButtonComponent } from '../../../ui-lib/public-api';
import { MaterialModule } from '../../../material.module';

interface TeamOption {
  id: string;
  name: string;
  logoUrl: string;
}

@Component({
  selector: 'app-bonus-pick-form',
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule,
    TranslateModule,
    UiButtonComponent,
    MaterialModule,
  ],
  templateUrl: './bonus-pick-form.component.html',
  styleUrls: ['./bonus-pick-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BonusPickFormComponent {
  private readonly bonusService = inject(BonusService);
  private readonly translate = inject(TranslateService);

  championshipId = input.required<string>();
  availableTeams = input.required<TeamOption[]>();
  eliminatedTeamIds = input<string[]>([]);

  activeBonusRules = signal<BonusRule[]>([]);
  myPicks = signal<Map<string, BonusPick>>(new Map());
  ruleUpdateMode = signal<Set<string>>(new Set());
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  readonly sortedAvailableTeams = computed(() =>
    [...this.availableTeams()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    ),
  );

  BonusRuleType = BonusRuleType;
  readonly icons = UI_ICONS;

  constructor() {
    effect(() => {
      const champId = this.championshipId();
      if (champId) {
        this.loadActiveBonusRules();
      }
    });
  }

  isBeforeDeadline(rule: BonusRule): boolean {
    return new Date(rule.deadline) > new Date();
  }

  getTimeUntilDeadline(rule: BonusRule): string {
    const now = new Date().getTime();
    const deadline = new Date(rule.deadline).getTime();
    const diff = deadline - now;

    if (diff <= 0) {
      return this.translate.instant('bonus.pickForm.deadlineExpired');
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getConfigPoints(rule: BonusRule): string {
    if (rule.type === BonusRuleType.CHAMPION) {
      const config = rule.config as ChampionConfig;
      return this.translate.instant('bonus.pickForm.pointsChampion', {
        points: config.championPoints,
      });
    } else {
      const config = rule.config as ChampionFinalistConfig;
      return this.translate.instant('bonus.pickForm.pointsChampionFinalist', {
        championPoints: config.championPoints,
        finalistPoints: config.finalistPoints,
      });
    }
  }

  getSelectedTeamId(ruleId: string): string | null {
    return this.myPicks().get(ruleId)?.teamId || null;
  }

  getSelectedTeam(ruleId: string): TeamOption | null {
    const selectedTeamId = this.getSelectedTeamId(ruleId);
    if (!selectedTeamId) {
      return null;
    }

    return this.availableTeams().find((team) => team.id === selectedTeamId) ?? null;
  }

  isRuleInUpdateMode(ruleId: string): boolean {
    return this.ruleUpdateMode().has(ruleId);
  }

  shouldShowSelect(ruleId: string): boolean {
    return !this.getSelectedTeamId(ruleId) || this.isRuleInUpdateMode(ruleId);
  }

  startUpdate(ruleId: string): void {
    const current = new Set(this.ruleUpdateMode());
    current.add(ruleId);
    this.ruleUpdateMode.set(current);
  }

  stopUpdate(ruleId: string): void {
    const current = new Set(this.ruleUpdateMode());
    current.delete(ruleId);
    this.ruleUpdateMode.set(current);
  }

  isEliminatedTeam(teamId: string): boolean {
    return this.eliminatedTeamIds().includes(teamId);
  }

  private loadActiveBonusRules(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.getActiveBonusRules(this.championshipId()).subscribe({
      next: (rules) => {
        this.activeBonusRules.set(rules);
        this.ruleUpdateMode.set(new Set());
        // Load existing picks for each rule
        rules.forEach((rule) => this.loadMyPick(rule.id));
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.pickForm.errors.loadRules'),
        );
        this.isLoading.set(false);
      },
    });
  }

  private loadMyPick(bonusRuleId: string): void {
    this.bonusService.getMyPick(bonusRuleId).subscribe({
      next: (pick) => {
        if (pick) {
          const currentPicks = this.myPicks();
          currentPicks.set(bonusRuleId, pick);
          this.myPicks.set(new Map(currentPicks));
        }
      },
      error: () => {},
    });
  }

  onTeamSelect(bonusRule: BonusRule, teamId: string): void {
    if (!this.isBeforeDeadline(bonusRule)) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.createOrUpdatePick(bonusRule.id, { teamId }).subscribe({
      next: (pick) => {
        const currentPicks = this.myPicks();
        currentPicks.set(bonusRule.id, pick);
        this.myPicks.set(new Map(currentPicks));
        this.stopUpdate(bonusRule.id);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.pickForm.errors.savePick'),
        );
        this.isLoading.set(false);
      },
    });
  }
}
