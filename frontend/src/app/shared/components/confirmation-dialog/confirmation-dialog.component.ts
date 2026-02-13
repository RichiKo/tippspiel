import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../ui-lib/public-api';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  title = input<string>('Bestaetigung');
  message = input.required<string>();
  confirmLabel = input<string>('Ja');
  cancelLabel = input<string>('Abbrechen');
  visible = input<boolean>(false);
  showCancelButton = input<boolean>(true);

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
