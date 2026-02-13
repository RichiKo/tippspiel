import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { UiButtonComponent } from '../button/ui-button.component';
import { UI_ICONS } from '../../icons/ui-icons';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  imports: [UiButtonComponent, LucideAngularModule],
  templateUrl: './ui-page-header.component.html',
  styleUrl: './ui-page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiPageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string | null>(null);
  kicker = input<string | null>(null);
  showBack = input(false);
  backLabel = input('Zurueck');

  back = output<void>();

  readonly icons = UI_ICONS;

  onBack(): void {
    this.back.emit();
  }
}
