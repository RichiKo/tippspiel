import {
  Component,
  computed,
  input,
  signal,
  inject,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BonusService } from '../../services/bonus.service';
import {
  BonusRule,
  BonusRuleType,
  BonusRuleStatus,
  CreateBonusRuleDto,
  UpdateBonusRuleDto,
  EvaluateBonusDto,
  BonusPick,
} from '../../types/bonus.interface';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { MaterialModule } from '../../../material.module';

interface TeamOption {
  id: string;
  name: string;
  logoUrl: string;
}

@Component({
  selector: 'app-bonus-admin',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    MaterialModule,
    ConfirmationDialogComponent,
  ],
  templateUrl: './bonus-admin.component.html',
  styleUrls: ['./bonus-admin.component.scss'],
})
export class BonusAdminComponent {
  private readonly bonusService = inject(BonusService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  championshipId = input.required<string>();
  availableTeams = input.required<TeamOption[]>();
  eliminatedTeamIds = input<string[]>([]);

  readonly sortedAvailableTeams = computed(() => {
    const eliminatedTeamIds = new Set(this.eliminatedTeamIds());

    return this.availableTeams()
      .filter((team) => !eliminatedTeamIds.has(team.id))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
      );
  });

  bonusRules = signal<BonusRule[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  showCreateForm = signal<boolean>(false);
  showEditForm = signal<boolean>(false);
  editingRule = signal<BonusRule | null>(null);
  showEvaluateDialog = signal<boolean>(false);
  currentEvaluatingRule = signal<BonusRule | null>(null);
  evaluationPhase = signal<'none' | 'finalists_done' | 'complete'>('none');
  publishRuleToConfirm = signal<BonusRule | null>(null);
  deleteRuleToConfirm = signal<BonusRule | null>(null);
  allPicks = signal<BonusPick[]>([]);

  BonusRuleType = BonusRuleType;
  BonusRuleStatus = BonusRuleStatus;

  createForm = this.fb.group({
    type: [BonusRuleType.CHAMPION, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    deadline: ['', Validators.required],
    championPoints: [10, [Validators.required, Validators.min(1)]],
    finalistPoints: [5, Validators.min(1)],
  });

  evaluateForm = this.fb.group({
    championTeamId: [''],
    finalistTeam1Id: [''],
    finalistTeam2Id: [''],
  });

  constructor() {
    effect(() => {
      const champId = this.championshipId();
      if (champId) {
        this.loadBonusRules();
      }
    });
  }

  private loadBonusRules(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.getBonusRules(this.championshipId()).subscribe({
      next: (rules) => {
        this.bonusRules.set(rules);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.loadRules'),
        );
        this.isLoading.set(false);
      },
    });
  }

  onCreateBonus(): void {
    if (this.createForm.invalid) return;

    const formValue = this.createForm.value;
    const type = formValue.type as BonusRuleType;

    const config: any = {
      championPoints: formValue.championPoints!,
    };

    if (type === BonusRuleType.CHAMPION_FINALIST) {
      config.finalistPoints = formValue.finalistPoints!;
    }

    const dto: CreateBonusRuleDto = {
      championshipId: this.championshipId(),
      type,
      name: formValue.name!,
      config,
      deadline: new Date(formValue.deadline!).toISOString(),
    };

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.createBonusRule(dto).subscribe({
      next: () => {
        this.successMessage.set(
          this.translate.instant('bonus.admin.success.created'),
        );
        this.showCreateForm.set(false);
        this.createForm.reset({
          type: BonusRuleType.CHAMPION,
          championPoints: 10,
          finalistPoints: 5,
        });
        this.loadBonusRules();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.createRule'),
        );
        this.isLoading.set(false);
      },
    });
  }

  onToggleCreateForm(): void {
    const shouldShowCreateForm = !this.showCreateForm();
    this.showCreateForm.set(shouldShowCreateForm);
    this.showEditForm.set(false);
    this.editingRule.set(null);

    if (shouldShowCreateForm) {
      this.enableRuleFormControls();
      this.createForm.reset({
        type: BonusRuleType.CHAMPION,
        championPoints: 10,
        finalistPoints: 5,
      });
    }
  }

  onEditRule(rule: BonusRule): void {
    this.editingRule.set(rule);
    this.showEditForm.set(true);
    this.showCreateForm.set(false);
    this.configureEditFormControls(rule);

    // Pre-fill form with existing values
    const config = rule.config as any;
    const deadlineStr = new Date(rule.deadline).toISOString().slice(0, 16);

    this.createForm.patchValue({
      type: rule.type,
      name: rule.name,
      deadline: deadlineStr,
      championPoints: config.championPoints,
      finalistPoints: config.finalistPoints || 5,
    });
  }

  onUpdateBonus(): void {
    if (this.createForm.invalid) return;
    const rule = this.editingRule();
    if (!rule) return;

    const formValue = this.createForm.getRawValue();

    if (this.isLimitedEdit(rule)) {
      const dto: UpdateBonusRuleDto = {
        name: formValue.name!,
        deadline: new Date(formValue.deadline!).toISOString(),
      };

      this.updateBonusRule(rule.id, dto);
      return;
    }

    const type = formValue.type as BonusRuleType;

    const config: any = {
      championPoints: formValue.championPoints!,
    };

    if (type === BonusRuleType.CHAMPION_FINALIST) {
      config.finalistPoints = formValue.finalistPoints!;
    }

    const dto: UpdateBonusRuleDto = {
      name: formValue.name!,
      config,
      deadline: new Date(formValue.deadline!).toISOString(),
    };

    this.updateBonusRule(rule.id, dto);
  }

  onCancelForm(): void {
    this.showCreateForm.set(false);
    this.showEditForm.set(false);
    this.editingRule.set(null);
    this.enableRuleFormControls();
    this.createForm.reset({
      type: BonusRuleType.CHAMPION,
      championPoints: 10,
      finalistPoints: 5,
    });
  }

  onPublishRule(rule: BonusRule): void {
    this.publishRuleToConfirm.set(rule);
  }

  onPublishCancelled(): void {
    this.publishRuleToConfirm.set(null);
  }

  onPublishConfirmed(): void {
    const rule = this.publishRuleToConfirm();
    if (!rule) {
      return;
    }
    this.publishRuleToConfirm.set(null);

    this.isLoading.set(true);
    this.bonusService.publishBonusRule(rule.id).subscribe({
      next: () => {
        this.successMessage.set(
          this.translate.instant('bonus.admin.success.published'),
        );
        this.loadBonusRules();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.publishRule'),
        );
        this.isLoading.set(false);
      },
    });
  }

  onDeleteRule(rule: BonusRule): void {
    this.deleteRuleToConfirm.set(rule);
  }

  onDeleteCancelled(): void {
    this.deleteRuleToConfirm.set(null);
  }

  onDeleteConfirmed(): void {
    const rule = this.deleteRuleToConfirm();
    if (!rule) {
      return;
    }
    this.deleteRuleToConfirm.set(null);

    this.isLoading.set(true);
    this.bonusService.deleteBonusRule(rule.id).subscribe({
      next: () => {
        this.successMessage.set(
          this.translate.instant('bonus.admin.success.deleted'),
        );
        this.loadBonusRules();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.deleteRule'),
        );
        this.isLoading.set(false);
      },
    });
  }

  getPublishConfirmMessage(): string {
    const rule = this.publishRuleToConfirm();
    return rule
      ? this.translate.instant('bonus.admin.confirm.publishMessage', {
          name: rule.name,
        })
      : '';
  }

  getDeleteConfirmMessage(): string {
    const rule = this.deleteRuleToConfirm();
    return rule
      ? this.translate.instant('bonus.admin.confirm.deleteMessage', {
          name: rule.name,
        })
      : '';
  }

  onOpenEvaluateDialog(rule: BonusRule): void {
    this.currentEvaluatingRule.set(rule);
    this.showEvaluateDialog.set(true);
    this.evaluationPhase.set('none');
    this.evaluateForm.reset({
      championTeamId: '',
      finalistTeam1Id: '',
      finalistTeam2Id: '',
    });

    // Load all picks for this rule
    this.bonusService.getAllPicksAdmin(rule.id).subscribe({
      next: (picks) => {
        this.allPicks.set(picks);
      },
      error: () => {},
    });

    // Pre-fill form with current evaluation result.
    if (rule.type === BonusRuleType.CHAMPION_FINALIST) {
        this.bonusService.getEvaluationResult(rule.id).subscribe({
        next: (result) => {
          this.evaluationPhase.set(result.phase);
          const finalistIds = Array.isArray(result.finalistTeamIds)
            ? result.finalistTeamIds
            : [];
          this.evaluateForm.patchValue({
            championTeamId: result.championTeamId ?? '',
            finalistTeam1Id: finalistIds[0] ?? '',
            finalistTeam2Id: finalistIds[1] ?? '',
          });
        },
        error: () => {},
      });
    } else if (rule.status === BonusRuleStatus.EVALUATED) {
      this.bonusService.getEvaluationResult(rule.id).subscribe({
        next: (result) => {
          this.evaluateForm.patchValue({
            championTeamId: result.championTeamId ?? '',
          });
        },
        error: () => {},
      });
    }
  }

  onEvaluateBonus(): void {
    const rule = this.currentEvaluatingRule();
    if (!rule) return;

    const formValue = this.evaluateForm.value;
    const dto: EvaluateBonusDto = {};

    if (rule.type === BonusRuleType.CHAMPION_FINALIST) {
      const phase = this.evaluationPhase();
      const finalist1 = formValue.finalistTeam1Id?.trim() || '';
      const finalist2 = formValue.finalistTeam2Id?.trim() || '';
      const champion = formValue.championTeamId?.trim() || '';

      if (phase === 'none') {
        if (!finalist1 || !finalist2) {
          this.errorMessage.set(
            this.translate.instant('bonus.admin.errors.selectBothFinalists'),
          );
          return;
        }
        if (finalist1 === finalist2) {
          this.errorMessage.set(
            this.translate.instant('bonus.admin.errors.finalistsMustDiffer'),
          );
          return;
        }
        dto.finalistTeamIds = [finalist1, finalist2];
      } else {
        if (!champion) {
          this.errorMessage.set(
            this.translate.instant('bonus.admin.errors.selectChampionFromFinalists'),
          );
          return;
        }
        dto.championTeamId = champion;
      }
    } else {
      const champion = formValue.championTeamId?.trim() || '';
      if (!champion) {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.selectChampion'),
        );
        return;
      }
      dto.championTeamId = champion;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.evaluateBonus(rule.id, dto).subscribe({
      next: (result) => {
        this.successMessage.set(
          this.translate.instant('bonus.admin.success.evaluated', {
            count: result.evaluationsCreated,
          }),
        );
        this.showEvaluateDialog.set(false);
        this.currentEvaluatingRule.set(null);
        this.loadBonusRules();
        setTimeout(() => this.successMessage.set(null), 5000);
      },
      error: (error) => {
        const errorMsg =
          error?.error?.message ||
          error?.message ||
          this.translate.instant('bonus.admin.errors.evaluateUnknown');
        this.errorMessage.set(errorMsg);
        this.isLoading.set(false);
      },
    });
  }

  closeEvaluateDialog(): void {
    this.showEvaluateDialog.set(false);
    this.currentEvaluatingRule.set(null);
    this.evaluationPhase.set('none');
    this.evaluateForm.reset();
  }

  getStatusBadgeClass(status: BonusRuleStatus): string {
    switch (status) {
      case BonusRuleStatus.DRAFT:
        return 'badge-draft';
      case BonusRuleStatus.PUBLISHED:
        return 'badge-published';
      case BonusRuleStatus.LOCKED:
        return 'badge-locked';
      case BonusRuleStatus.PARTIALLY_EVALUATED:
        return 'badge-evaluated';
      case BonusRuleStatus.EVALUATED:
        return 'badge-evaluated';
      default:
        return '';
    }
  }

  getStatusLabel(status: BonusRuleStatus): string {
    switch (status) {
      case BonusRuleStatus.DRAFT:
        return this.translate.instant('bonus.admin.status.draft');
      case BonusRuleStatus.PUBLISHED:
        return this.translate.instant('bonus.admin.status.published');
      case BonusRuleStatus.LOCKED:
        return this.translate.instant('bonus.admin.status.locked');
      case BonusRuleStatus.PARTIALLY_EVALUATED:
        return this.translate.instant('bonus.admin.status.partiallyEvaluated');
      case BonusRuleStatus.EVALUATED:
        return this.translate.instant('bonus.admin.status.evaluated');
      default:
        return status;
    }
  }

  getTypeLabel(type: BonusRuleType): string {
    switch (type) {
      case BonusRuleType.CHAMPION:
        return this.translate.instant('bonus.admin.type.champion');
      case BonusRuleType.CHAMPION_FINALIST:
        return this.translate.instant('bonus.admin.type.championFinalist');
      default:
        return type;
    }
  }

  isBeforeDeadline(rule: BonusRule): boolean {
    return new Date(rule.deadline) > new Date();
  }

  isLimitedEdit(rule: BonusRule): boolean {
    return !this.canFullyEditRule(rule);
  }

  canFullyEditRule(rule: BonusRule): boolean {
    return (
      rule.status === BonusRuleStatus.DRAFT ||
      (rule.status === BonusRuleStatus.PUBLISHED && this.isBeforeDeadline(rule))
    );
  }

  getChampionOptions(): TeamOption[] {
    const rule = this.currentEvaluatingRule();
    if (!rule) {
      return [];
    }
    if (rule.type === BonusRuleType.CHAMPION) {
      return this.sortedAvailableTeams();
    }

    const finalist1 = this.evaluateForm.value.finalistTeam1Id || '';
    const finalist2 = this.evaluateForm.value.finalistTeam2Id || '';
    const finalistIds = new Set([finalist1, finalist2].filter(Boolean));
    return this.sortedAvailableTeams().filter((team) => finalistIds.has(team.id));
  }

  private updateBonusRule(ruleId: string, dto: UpdateBonusRuleDto): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.bonusService.updateBonusRule(ruleId, dto).subscribe({
      next: () => {
        this.successMessage.set(
          this.translate.instant('bonus.admin.success.updated'),
        );
        this.showEditForm.set(false);
        this.editingRule.set(null);
        this.enableRuleFormControls();
        this.createForm.reset({
          type: BonusRuleType.CHAMPION,
          championPoints: 10,
          finalistPoints: 5,
        });
        this.loadBonusRules();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.errorMessage.set(
          this.translate.instant('bonus.admin.errors.updateRule'),
        );
        this.isLoading.set(false);
      },
    });
  }

  private configureEditFormControls(rule: BonusRule): void {
    this.enableRuleFormControls();

    if (!this.isLimitedEdit(rule)) {
      return;
    }

    this.createForm.controls.type.disable();
    this.createForm.controls.championPoints.disable();
    this.createForm.controls.finalistPoints.disable();
  }

  private enableRuleFormControls(): void {
    this.createForm.controls.type.enable();
    this.createForm.controls.name.enable();
    this.createForm.controls.deadline.enable();
    this.createForm.controls.championPoints.enable();
    this.createForm.controls.finalistPoints.enable();
  }
}
