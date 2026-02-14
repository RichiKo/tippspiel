import { Component, signal, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CreateGameDto, UpdateGameDto, UpdateGameResultDto, Game } from '../../types/game.interface';
import { Team } from '../../../teams/types/team.interface';

@Component({
  selector: 'app-game-dialog',
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="dialog-overlay" *ngIf="visible()" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>{{
          gameId()
            ? ('championship.dialogs.game.titleEdit' | translate)
            : ('championship.dialogs.game.titleCreate' | translate)
        }}</h2>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>{{ 'championship.dialogs.game.homeTeamLabel' | translate }}</label>
            <select [(ngModel)]="homeTeamId" name="homeTeamId" required>
              <option value="">{{ 'championship.dialogs.game.selectTeamOption' | translate }}</option>
              @for (team of teams(); track team.id) {
                <option [value]="team.id" [disabled]="isTeamDisabled(team.id, 'home')">
                  {{
                    team.name +
                      (isTeamDisabled(team.id, 'home')
                        ? (' ' + ('championship.dialogs.game.eliminatedSuffix' | translate))
                        : '')
                  }}
                </option>
              }
            </select>
          </div>

          <div class="form-field">
            <label>{{ 'championship.dialogs.game.awayTeamLabel' | translate }}</label>
            <select [(ngModel)]="awayTeamId" name="awayTeamId" required>
              <option value="">{{ 'championship.dialogs.game.selectTeamOption' | translate }}</option>
              @for (team of teams(); track team.id) {
                <option [value]="team.id" [disabled]="isTeamDisabled(team.id, 'away')">
                  {{
                    team.name +
                      (isTeamDisabled(team.id, 'away')
                        ? (' ' + ('championship.dialogs.game.eliminatedSuffix' | translate))
                        : '')
                  }}
                </option>
              }
            </select>
          </div>

          <div class="form-field">
            <label>{{ 'championship.dialogs.game.kickoffLabel' | translate }}</label>
            <input 
              type="datetime-local" 
              [(ngModel)]="kickoffTime" 
              name="kickoffTime"
              step="900"
              required
            />
          </div>

          @if (gameId()) {
            <div class="form-section">
              <h3>{{ 'championship.dialogs.game.resultSection' | translate }}</h3>
              
              <div class="form-row">
                <div class="form-field">
                  <label>{{ 'championship.dialogs.game.homeGoalsLabel' | translate }}</label>
                  <input 
                    type="number" 
                    [(ngModel)]="homeScore" 
                    name="homeScore"
                    min="0"
                  />
                </div>

                <div class="form-field">
                  <label>{{ 'championship.dialogs.game.awayGoalsLabel' | translate }}</label>
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
  styles: [`
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
      min-width: 400px;
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

        input, select {
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

        &.checkbox-field {
          label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;

            input[type="checkbox"] {
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
  `],
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
  kickoffTime = '';
  homeScore: number | null = null;
  awayScore: number | null = null;
  isClosed = false;

  constructor() {
    effect(() => {
      const game = this.gameData();
      if (game) {
        this.homeTeamId = game.homeTeamId;
        this.awayTeamId = game.awayTeamId;
        this.kickoffTime = this.formatDateTimeLocal(new Date(game.kickoffTime));
        this.homeScore = game.homeScore;
        this.awayScore = game.awayScore;
        this.isClosed = game.isClosed;
      }
    });
  }

  isValid() {
    return this.homeTeamId && this.awayTeamId && this.kickoffTime && this.homeTeamId !== this.awayTeamId;
  }

  isTeamDisabled(teamId: string, side: 'home' | 'away') {
    const isEliminated = this.eliminatedTeamIds().includes(teamId);
    if (!isEliminated) {
      return false;
    }

    return side === 'home' ? this.homeTeamId !== teamId : this.awayTeamId !== teamId;
  }

  onSubmit() {
    if (!this.isValid()) return;

    if (this.gameId()) {
      // Edit mode: send both game data and result
      const gameDto: UpdateGameDto = {
        homeTeamId: this.homeTeamId,
        awayTeamId: this.awayTeamId,
        kickoffTime: new Date(this.kickoffTime),
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
        kickoffTime: new Date(this.kickoffTime),
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
    this.kickoffTime = '';
    this.homeScore = null;
    this.awayScore = null;
    this.isClosed = false;
  }

  private formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
