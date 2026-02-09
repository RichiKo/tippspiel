import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  title = input<string>('Bestätigung');
  message = input.required<string>();
  confirmLabel = input<string>('Ja');
  cancelLabel = input<string>('Abbrechen');
  visible = input<boolean>(false);
  showCancelButton = input<boolean>(true);

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
