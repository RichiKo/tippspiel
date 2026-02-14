import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UiButtonComponent } from '../../../ui-lib/public-api';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, TranslateModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  title = input<string>('common.confirmation.title');
  message = input.required<string>();
  confirmLabel = input<string>('common.confirm');
  cancelLabel = input<string>('common.cancel');
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
