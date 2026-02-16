import { Component, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  CreateGameDto,
  UpdateGameDto,
  UpdateGameResultDto,
  Game,
} from '../../types/game.interface';
import { Team } from '../../../teams/types/team.interface';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-game-dialog',
  imports: [CommonModule, FormsModule, TranslateModule, MaterialModule],
  template: `
    <div class="dialog-overlay" *ngIf="visible()" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>
          {{
            gameId()
              ? ('championship.dialogs.game.titleEdit' | translate)
              : ('championship.dialogs.game.titleCreate' | translate)
          }}
        </h2>

        <form (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>{{
              'championship.dialogs.game.homeTeamLabel' | translate
            }}</label>
            <mat-form-field appearance="outline" class="select-field">
              <mat-select
                [(ngModel)]="homeTeamId"
                name="homeTeamId"
                panelClass="game-dialog-team-select-panel"
                required
              >
                <mat-option [value]="''">
                  {{ 'championship.dialogs.game.selectTeamOption' | translate }}
                </mat-option>
                @for (team of teams(); track team.id) {
                  <mat-option
                    [value]="team.id"
                    [disabled]="isTeamDisabled(team.id, 'home')"
                  >
                    {{
                      team.name +
                        (isTeamDisabled(team.id, 'home')
                          ? ' ' +
                            ('championship.dialogs.game.eliminatedSuffix'
                              | translate)
                          : '')
                    }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-field">
            <label>{{
              'championship.dialogs.game.awayTeamLabel' | translate
            }}</label>
            <mat-form-field appearance="outline" class="select-field">
              <mat-select
                [(ngModel)]="awayTeamId"
                name="awayTeamId"
                panelClass="game-dialog-team-select-panel"
                required
              >
                <mat-option [value]="''">
                  {{ 'championship.dialogs.game.selectTeamOption' | translate }}
                </mat-option>
                @for (team of teams(); track team.id) {
                  <mat-option
                    [value]="team.id"
                    [disabled]="isTeamDisabled(team.id, 'away')"
                  >
                    {{
                      team.name +
                        (isTeamDisabled(team.id, 'away')
                          ? ' ' +
                            ('championship.dialogs.game.eliminatedSuffix'
                              | translate)
                          : '')
                    }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-field">
            <label>{{
              'championship.dialogs.game.kickoffLabel' | translate
            }}</label>
            <div class="form-row kickoff-row">
              <mat-form-field appearance="outline" class="select-field">
                <input
                  matInput
                  [matDatepicker]="kickoffDatepicker"
                  [(ngModel)]="kickoffDate"
                  name="kickoffDate"
                  required
                />
                <mat-datepicker-toggle
                  matSuffix
                  [for]="kickoffDatepicker"
                ></mat-datepicker-toggle>
                <mat-datepicker #kickoffDatepicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline" class="select-field">
                <input
                  matInput
                  [matTimepicker]="kickoffTimepicker"
                  [(ngModel)]="kickoffTime"
                  name="kickoffTime"
                  required
                />
                <mat-timepicker-toggle
                  matSuffix
                  [for]="kickoffTimepicker"
                ></mat-timepicker-toggle>
                <mat-timepicker #kickoffTimepicker interval="15m"></mat-timepicker>
              </mat-form-field>
            </div>
          </div>

          @if (gameId()) {
            <div class="form-section">
              <h3>
                {{ 'championship.dialogs.game.resultSection' | translate }}
              </h3>

              <div class="form-row">
                <div class="form-field">
                  <label>{{
                    'championship.dialogs.game.homeGoalsLabel' | translate
                  }}</label>
                  <input
                    type="number"
                    [(ngModel)]="homeScore"
                    name="homeScore"
                    min="0"
                  />
                </div>

                <div class="form-field">
                  <label>{{
                    'championship.dialogs.game.awayGoalsLabel' | translate
                  }}</label>
                  <input
                    type="number"
                    [(ngModel)]="awayScore"
                    name="awayScore"
                    min="0"
                  />
                </div>
              </div>

              <div class="form-field checkbox-field">
                <label>
                  <input
                    type="checkbox"
                    [(ngModel)]="isClosed"
                    name="isClosed"
                  />
                  {{ 'championship.dialogs.game.closedLabel' | translate }}
                </label>
              </div>
            </div>
          }

          <div class="dialog-actions">
            <button type="button" class="cancel-btn" (click)="onCancel()">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit" class="submit-btn" [disabled]="!isValid()">
              {{
                gameId()
                  ? ('championship.dialogs.game.update' | translate)
                  : ('championship.dialogs.game.create' | translate)
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .dialog-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        width: min(
          680px,
          calc(
            100vw - max(20px, env(safe-area-inset-left, 0px)) -
              max(20px, env(safe-area-inset-right, 0px))
          )
        );
        max-width: 90vw;
        max-height: 90vh;
        overflow-y: auto;

        h2 {
          margin: 0 0 1.5rem 0;
        }

        h3 {
          margin: 1.5rem 0 1rem 0;
          font-size: 1.1rem;
          color: #666;
        }

        .form-section {
          border-top: 1px solid #e0e0e0;
          padding-top: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .form-field {
          margin-bottom: 1.5rem;

          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 1rem;

            &:focus {
              outline: none;
              border-color: #1976d2;
            }
          }

          .select-field {
            width: 100%;
            margin-bottom: 0;

            ::ng-deep .mat-mdc-text-field-wrapper {
              background: #fff;
            }

            ::ng-deep .mat-mdc-form-field-subscript-wrapper {
              display: none;
            }
          }

          &.checkbox-field {
            label {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              cursor: pointer;

              input[type='checkbox'] {
                width: auto;
                cursor: pointer;
              }
            }
          }
        }

        .dialog-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;

          button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;

            &.cancel-btn {
              background: #e0e0e0;
              color: #333;

              &:hover {
                background: #d0d0d0;
              }
            }

            &.submit-btn {
              background: #1976d2;
              color: white;

              &:hover:not(:disabled) {
                background: #1565c0;
              }

              &:disabled {
                background: #bdbdbd;
                cursor: not-allowed;
              }
            }
          }
        }
      }

      @media (max-width: 767px) {
        .dialog-overlay {
          align-items: flex-end;
          padding-left: max(8px, env(safe-area-inset-left, 0px));
          padding-right: max(8px, env(safe-area-inset-right, 0px));
          padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
        }

        .dialog-content {
          width: 100%;
          max-width: none;
          max-height: min(86dvh, 720px);
          border-radius: 14px 14px 0 0;
          padding: 1rem;
        }

        .dialog-content .form-row {
          grid-template-columns: 1fr;
        }

        .dialog-content .form-field input {
          min-height: 44px;
          font-size: 16px;
        }

        .dialog-content .dialog-actions {
          flex-direction: column-reverse;
        }

        .dialog-content .dialog-actions button {
          width: 100%;
          min-height: 44px;
        }
      }
    `,
  ],
})
export class GameDialogComponent {
  visible = input<boolean>(false);
  gameId = input<string | null>(null);
  gameData = input<Game | null>(null);
  teams = input<Team[]>([]);
  eliminatedTeamIds = input<string[]>([]);

  confirmed = output<CreateGameDto | UpdateGameDto | UpdateGameResultDto>();
  cancelled = output<void>();

  homeTeamId = '';
  awayTeamId = '';
  kickoffDate: Date | null = null;
  kickoffTime: Date | null = null;
  homeScore: number | null = null;
  awayScore: number | null = null;
  isClosed = false;

  constructor() {
    effect(() => {
      const game = this.gameData();
      if (game) {
        this.homeTeamId = game.homeTeamId;
        this.awayTeamId = game.awayTeamId;
        const kickoff = new Date(game.kickoffTime);
        this.kickoffDate = kickoff;
        this.kickoffTime = kickoff;
        this.homeScore = game.homeScore;
        this.awayScore = game.awayScore;
        this.isClosed = game.isClosed;
      }
    });
  }

  isValid() {
    return (
      this.homeTeamId &&
      this.awayTeamId &&
      this.kickoffDate &&
      this.kickoffTime &&
      this.homeTeamId !== this.awayTeamId
    );
  }

  isTeamDisabled(teamId: string, side: 'home' | 'away') {
    const isEliminated = this.eliminatedTeamIds().includes(teamId);
    if (!isEliminated) {
      return false;
    }

    return side === 'home'
      ? this.homeTeamId !== teamId
      : this.awayTeamId !== teamId;
  }

  onSubmit() {
    if (!this.isValid()) return;
    const kickoffTime = this.combineKickoffDateTime();
    if (!kickoffTime) return;

    if (this.gameId()) {
      // Edit mode: send both game data and result
      const gameDto: UpdateGameDto = {
        homeTeamId: this.homeTeamId,
        awayTeamId: this.awayTeamId,
        kickoffTime,
      };

      const resultDto: UpdateGameResultDto = {
        homeScore: this.homeScore ?? 0,
        awayScore: this.awayScore ?? 0,
        isClosed: this.isClosed,
      };

      // Emit both as a combined object
      this.confirmed.emit({ ...gameDto, ...resultDto } as any);
    } else {
      // Create mode
      const dto: CreateGameDto = {
        homeTeamId: this.homeTeamId,
        awayTeamId: this.awayTeamId,
        kickoffTime,
      };
      this.confirmed.emit(dto);
    }

    this.reset();
  }

  onCancel() {
    this.cancelled.emit();
    this.reset();
  }

  private reset() {
    this.homeTeamId = '';
    this.awayTeamId = '';
    this.kickoffDate = null;
    this.kickoffTime = null;
    this.homeScore = null;
    this.awayScore = null;
    this.isClosed = false;
  }

  private combineKickoffDateTime(): Date | null {
    if (!this.kickoffDate || !this.kickoffTime) {
      return null;
    }

    const kickoff = new Date(this.kickoffDate);
    kickoff.setHours(
      this.kickoffTime.getHours(),
      this.kickoffTime.getMinutes(),
      0,
      0,
    );
    return kickoff;
  }

}
