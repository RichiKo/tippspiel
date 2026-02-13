import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiCardVariant = 'default' | 'elevated' | 'subtle';
export type UiCardPadding = 'none' | 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-card',
  standalone: true,
  templateUrl: './ui-card.component.html',
  styleUrl: './ui-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  variant = input<UiCardVariant>('default');
  padding = input<UiCardPadding>('md');
  interactive = input(false);
}
