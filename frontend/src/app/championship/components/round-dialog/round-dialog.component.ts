import { Component, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateRoundDto } from '../../types/round.interface';

@Component({
  selector: 'app-round-dialog',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dialog-overlay" *ngIf="visible()" (click)="onCancel()">
      <div class="dialog-content" (click)="$event.stopPropagation()">
        <h2>{{ roundId() ? 'Spieltag bearbeiten' : 'Neuer Spieltag' }}</h2>
        
        <form (ngSubmit)="onSubmit()">
          <div class="form-field">
            <label>Name</label>
            <input 
              type="text" 
              [(ngModel)]="name" 
              name="name"
              placeholder="z.B. Vorrunde 1"
              required
            />
          </div>

          <div class="form-field">
            <label>Startdatum</label>
            <input 
              type="date" 
              [(ngModel)]="startDate" 
              name="startDate"
              required
            />
          </div>

          <div class="form-field">
            <label>Enddatum (optional)</label>
            <input 
              type="date" 
              [(ngModel)]="endDate" 
              name="endDate"
            />
          </div>

          <div class="dialog-actions">
            <button type="button" class="cancel-btn" (click)="onCancel()">
              Abbrechen
            </button>
            <button type="submit" class="submit-btn">
              {{ roundId() ? 'Aktualisieren' : 'Erstellen' }}
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
        }
      }
    }
  `],
})
export class RoundDialogComponent {
  visible = input<boolean>(false);
  roundId = input<string | null>(null);
  initialData = input<CreateRoundDto | null>(null);

  confirmed = output<CreateRoundDto>();
  cancelled = output<void>();

  name = '';
  startDate = '';
  endDate = '';

  onSubmit() {
    const dto: CreateRoundDto = {
      name: this.name,
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

  private reset() {
    this.name = '';
    this.startDate = '';
    this.endDate = '';
  }
}
