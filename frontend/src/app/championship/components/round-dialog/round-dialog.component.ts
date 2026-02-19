import { Component, output, input, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CreateRoundDto } from '../../types/round.interface';

@Component({
  selector: 'app-round-dialog',
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="dialog-overlay" *ngIf="visible()" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>{{
          roundId()
            ? ('championship.dialogs.round.titleEdit' | translate)
            : ('championship.dialogs.round.titleCreate' | translate)
        }}</h2>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>{{ 'championship.dialogs.round.nameLabel' | translate }}</label>
            <input 
              type="text" 
              [(ngModel)]="name" 
              name="name"
              [placeholder]="'championship.dialogs.round.namePlaceholder' | translate"
              required
            />
          </div>

          <div class="form-field">
            <label>{{ 'championship.dialogs.round.startDateLabel' | translate }}</label>
            <input 
              type="date" 
              [(ngModel)]="startDate" 
              name="startDate"
              required
            />
          </div>

          <div class="form-field">
            <label>{{ 'championship.dialogs.round.endDateLabel' | translate }}</label>
            <input 
              type="date" 
              [(ngModel)]="endDate" 
              name="endDate"
            />
          </div>

          <div class="dialog-actions">
            @if (roundId()) {
              <button type="button" class="delete-btn" (click)="onDeleteClick()">
                {{ 'championship.dialogs.round.delete' | translate }}
              </button>
            }
            <button type="button" class="cancel-btn" (click)="onCancel()">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="submit" class="submit-btn">
              {{
                roundId()
                  ? ('championship.dialogs.round.update' | translate)
                  : ('championship.dialogs.round.create' | translate)
              }}
            </button>
          </div>

          @if (showDeleteConfirmation) {
            <div class="delete-confirm">
              <p class="delete-confirm-message">
                {{ 'championship.dialogs.round.deleteConfirmMessage' | translate }}
              </p>
              <div class="delete-confirm-actions">
                <button type="button" class="cancel-btn" (click)="onDeleteAbort()">
                  {{ 'common.cancel' | translate }}
                </button>
                <button type="button" class="delete-btn" (click)="onDeleteConfirm()">
                  {{ 'common.delete' | translate }}
                </button>
              </div>
            </div>
          }
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
      width: min(
        560px,
        calc(
          100vw - max(20px, env(safe-area-inset-left, 0px)) -
            max(20px, env(safe-area-inset-right, 0px))
        )
      );
      max-width: 90vw;

      h2 {
        margin: 0 0 1.5rem 0;
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
      }

      .dialog-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        flex-wrap: wrap;

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

            &:hover {
              background: #1565c0;
            }
          }

          &.delete-btn {
            background: #dc2626;
            color: #ffffff;

            &:hover {
              background: #b91c1c;
            }
          }
        }
      }

      .delete-confirm {
        margin-top: 1rem;
        padding: 0.9rem;
        border: 1px solid #fecaca;
        border-radius: 8px;
        background: #fef2f2;
      }

      .delete-confirm-message {
        margin: 0 0 0.75rem;
        color: #7f1d1d;
        font-weight: 600;
      }

      .delete-confirm-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;

        button {
          padding: 0.65rem 1.1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.95rem;
        }
      }
    }

    @media (max-width: 767px) {
      .dialog-overlay {
        align-items: center;
        padding-left: max(8px, env(safe-area-inset-left, 0px));
        padding-right: max(8px, env(safe-area-inset-right, 0px));
        padding-top: max(8px, env(safe-area-inset-top, 0px));
        padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
      }

      .dialog-content {
        width: 100%;
        max-width: none;
        border-radius: 14px;
        padding: 1rem;
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

      .dialog-content .delete-confirm-actions {
        flex-direction: column-reverse;
      }

      .dialog-content .delete-confirm-actions button {
        width: 100%;
        min-height: 44px;
      }
    }
  `],
})
export class RoundDialogComponent implements OnDestroy {
  visible = input<boolean>(false);
  roundId = input<string | null>(null);
  initialData = input<CreateRoundDto | null>(null);

  confirmed = output<CreateRoundDto>();
  cancelled = output<void>();
  deleted = output<void>();

  name = '';
  startDate = '';
  endDate = '';
  showDeleteConfirmation = false;
  private isBodyScrollLockedByInstance = false;

  constructor() {
    effect(() => {
      this.setBodyScrollLocked(this.visible());
    });

    effect(() => {
      if (!this.visible()) {
        return;
      }
      this.applyInitialData();
    });
  }

  ngOnDestroy(): void {
    this.setBodyScrollLocked(false);
  }

  onSubmit() {
    const normalizedName = this.name.trim();
    if (!normalizedName || !this.startDate) {
      return;
    }

    const dto: CreateRoundDto = {
      name: normalizedName,
      startDate: new Date(this.startDate),
    };
    
    if (this.endDate) {
      dto.endDate = new Date(this.endDate);
    }
    
    this.confirmed.emit(dto);
    this.reset();
  }

  onCancel() {
    this.cancelled.emit();
    this.reset();
  }

  onDeleteClick(): void {
    this.showDeleteConfirmation = true;
  }

  onDeleteAbort(): void {
    this.showDeleteConfirmation = false;
  }

  onDeleteConfirm(): void {
    this.deleted.emit();
    this.reset();
  }

  private applyInitialData(): void {
    const initial = this.initialData();
    if (!initial) {
      this.reset();
      return;
    }

    this.name = initial.name ?? '';
    this.startDate = this.toDateInputValue(initial.startDate);
    this.endDate = initial.endDate
      ? this.toDateInputValue(initial.endDate)
      : '';
    this.showDeleteConfirmation = false;
  }

  private toDateInputValue(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private reset() {
    this.name = '';
    this.startDate = '';
    this.endDate = '';
    this.showDeleteConfirmation = false;
  }

  private setBodyScrollLocked(locked: boolean): void {
    if (typeof document === 'undefined') {
      return;
    }

    const countKey = 'dialogScrollLockCount';
    const scrollYKey = 'dialogScrollLockScrollY';
    const bodyOverflowKey = 'dialogScrollLockBodyOverflow';
    const bodyPositionKey = 'dialogScrollLockBodyPosition';
    const bodyTopKey = 'dialogScrollLockBodyTop';
    const bodyWidthKey = 'dialogScrollLockBodyWidth';
    const htmlOverflowKey = 'dialogScrollLockHtmlOverflow';
    const currentCount = Number.parseInt(
      document.body.dataset[countKey] ?? '0',
      10,
    );

    if (locked) {
      if (this.isBodyScrollLockedByInstance) {
        return;
      }

      if (currentCount === 0) {
        const scrollY =
          typeof window !== 'undefined'
            ? window.scrollY || window.pageYOffset || 0
            : 0;
        document.body.dataset[scrollYKey] = String(scrollY);
        document.body.dataset[bodyOverflowKey] = document.body.style.overflow;
        document.body.dataset[bodyPositionKey] = document.body.style.position;
        document.body.dataset[bodyTopKey] = document.body.style.top;
        document.body.dataset[bodyWidthKey] = document.body.style.width;
        document.body.dataset[htmlOverflowKey] =
          document.documentElement.style.overflow;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
      }

      document.body.dataset[countKey] = String(currentCount + 1);
      this.isBodyScrollLockedByInstance = true;
      return;
    }

    if (!this.isBodyScrollLockedByInstance) {
      return;
    }

    const nextCount = Math.max(0, currentCount - 1);
    document.body.dataset[countKey] = String(nextCount);
    this.isBodyScrollLockedByInstance = false;

    if (nextCount === 0) {
      const scrollY = Number.parseInt(document.body.dataset[scrollYKey] ?? '0', 10);
      document.body.style.overflow = document.body.dataset[bodyOverflowKey] ?? '';
      document.body.style.position = document.body.dataset[bodyPositionKey] ?? '';
      document.body.style.top = document.body.dataset[bodyTopKey] ?? '';
      document.body.style.width = document.body.dataset[bodyWidthKey] ?? '';
      document.documentElement.style.overflow =
        document.body.dataset[htmlOverflowKey] ?? '';
      if (typeof window !== 'undefined') {
        window.scrollTo(0, Number.isNaN(scrollY) ? 0 : scrollY);
      }
      delete document.body.dataset[scrollYKey];
      delete document.body.dataset[bodyOverflowKey];
      delete document.body.dataset[bodyPositionKey];
      delete document.body.dataset[bodyTopKey];
      delete document.body.dataset[bodyWidthKey];
      delete document.body.dataset[htmlOverflowKey];
      delete document.body.dataset[countKey];
    }
  }
}
