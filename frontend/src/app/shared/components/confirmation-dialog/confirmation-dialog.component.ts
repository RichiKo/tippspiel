import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  OnDestroy,
  output,
} from '@angular/core';
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
export class ConfirmationDialogComponent implements OnDestroy {
  title = input<string>('common.confirmation.title');
  message = input.required<string>();
  confirmLabel = input<string>('common.confirm');
  cancelLabel = input<string>('common.cancel');
  visible = input<boolean>(false);
  showCancelButton = input<boolean>(true);
  private isBodyScrollLockedByInstance = false;

  confirmed = output<void>();
  cancelled = output<void>();

  constructor() {
    effect(() => {
      this.setBodyScrollLocked(this.visible());
    });
  }

  ngOnDestroy(): void {
    this.setBodyScrollLocked(false);
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
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
