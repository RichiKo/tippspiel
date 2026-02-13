import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type UiBadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';
export type UiBadgeAppearance = 'soft' | 'solid';

@Component({
  selector: 'ui-badge',
  standalone: true,
  templateUrl: './ui-badge.component.html',
  styleUrl: './ui-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiBadgeComponent {
  tone = input<UiBadgeTone>('neutral');
  appearance = input<UiBadgeAppearance>('soft');
}
