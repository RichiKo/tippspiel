import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { Bell, LucideAngularModule, RefreshCw, Send } from 'lucide-angular';
import { UiButtonComponent } from '../../../ui-lib/public-api';
import { PushClientService } from '../../push-client.service';

@Component({
  selector: 'app-push-settings',
  standalone: true,
  imports: [TranslateModule, LucideAngularModule, UiButtonComponent],
  templateUrl: './push-settings.component.html',
  styleUrl: './push-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PushSettingsComponent implements OnInit {
  readonly client = inject(PushClientService);
  readonly icons = { bell: Bell, refresh: RefreshCw, send: Send };
  readonly toggleDisabled = computed(
    () =>
      !this.client.ready() ||
      this.client.busy() ||
      (!this.client.active() &&
        (!this.client.enabled() ||
          !this.client.supported() ||
          this.client.needsInstall() ||
          this.client.permission() === 'denied')),
  );
  readonly testDisabled = computed(
    () =>
      !this.client.ready() ||
      this.client.busy() ||
      !this.client.active() ||
      !this.client.enabled() ||
      !this.client.supported() ||
      this.client.permission() !== 'granted',
  );
  readonly statusKey = computed(() => {
    if (!this.client.ready()) return 'loading';
    if (this.client.needsInstall()) return 'installFirst';
    if (!this.client.supported()) return 'unsupported';
    if (!this.client.enabled()) return 'disabled';
    if (this.client.permission() === 'denied') return 'blocked';
    return this.client.active() ? 'active' : 'inactive';
  });

  ngOnInit(): void {
    void this.client.refresh();
  }

  toggle(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const enabled = checkbox.checked;
    checkbox.checked = this.client.active();
    if (this.toggleDisabled()) return;
    if (enabled) void this.client.enable();
    else void this.client.disable();
  }

  test(): void {
    if (!this.testDisabled()) void this.client.test();
  }

  refresh(): void {
    if (!this.client.busy()) void this.client.refresh();
  }
}
