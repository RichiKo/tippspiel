import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  BonusRule,
  BonusPick,
  CreateBonusRuleDto,
  UpdateBonusRuleDto,
  CreateBonusPickDto,
  EvaluateBonusDto,
  EvaluateBonusResponse,
  EvaluationResult,
  BonusRuleStatus,
} from '../types/bonus.interface';

@Injectable({ providedIn: 'root' })
export class BonusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  // ========== Admin Methods ==========

  createBonusRule(dto: CreateBonusRuleDto): Observable<BonusRule> {
    return this.http.post<BonusRule>(
      `${this.apiUrl}/championships/${dto.championshipId}/bonus-rules`,
      dto,
    );
  }

  getBonusRules(
    championshipId: string,
    status?: BonusRuleStatus,
  ): Observable<BonusRule[]> {
    const params: Record<string, string> = status ? { status } : {};
    return this.http.get<BonusRule[]>(
      `${this.apiUrl}/championships/${championshipId}/bonus-rules`,
      { params },
    );
  }

  updateBonusRule(
    bonusRuleId: string,
    dto: UpdateBonusRuleDto,
  ): Observable<BonusRule> {
    return this.http.patch<BonusRule>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}`,
      dto,
    );
  }

  publishBonusRule(bonusRuleId: string): Observable<BonusRule> {
    return this.http.patch<BonusRule>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/publish`,
      {},
    );
  }

  deleteBonusRule(bonusRuleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bonus-rules/${bonusRuleId}`);
  }

  evaluateBonus(
    bonusRuleId: string,
    dto: EvaluateBonusDto,
  ): Observable<EvaluateBonusResponse> {
    return this.http.post<EvaluateBonusResponse>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/evaluate`,
      dto,
    );
  }

  getAllPicksAdmin(bonusRuleId: string): Observable<BonusPick[]> {
    return this.http.get<BonusPick[]>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/picks`,
    );
  }

  getEvaluationResult(bonusRuleId: string): Observable<EvaluationResult> {
    return this.http.get<EvaluationResult>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/evaluation-result`,
    );
  }

  // ========== User Methods ==========

  getActiveBonusRules(championshipId: string): Observable<BonusRule[]> {
    return this.http.get<BonusRule[]>(
      `${this.apiUrl}/championships/${championshipId}/bonus-rules/active`,
    );
  }

  createOrUpdatePick(
    bonusRuleId: string,
    dto: CreateBonusPickDto,
  ): Observable<BonusPick> {
    return this.http.post<BonusPick>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/pick`,
      dto,
    );
  }

  getMyPick(bonusRuleId: string): Observable<BonusPick | null> {
    return this.http.get<BonusPick | null>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/my-pick`,
    );
  }

  getAllPicksUser(bonusRuleId: string): Observable<BonusPick[]> {
    return this.http.get<BonusPick[]>(
      `${this.apiUrl}/bonus-rules/${bonusRuleId}/all-picks`,
    );
  }

  getEvaluatedBonusRules(championshipId: string): Observable<BonusRule[]> {
    return this.http.get<BonusRule[]>(
      `${this.apiUrl}/championships/${championshipId}/bonus-rules/evaluated`,
    );
  }
}
