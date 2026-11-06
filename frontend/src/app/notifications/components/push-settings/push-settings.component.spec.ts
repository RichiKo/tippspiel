import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PushClientService } from '../../push-client.service';
import { PushSettingsComponent } from './push-settings.component';

describe('PushSettingsComponent', () => {
  let fixture: ComponentFixture<PushSettingsComponent>;
  let client: {
    ready: ReturnType<typeof signal<boolean>>;
    supported: ReturnType<typeof signal<boolean>>;
    needsInstall: ReturnType<typeof signal<boolean>>;
    permission: ReturnType<typeof signal<NotificationPermission>>;
    enabled: ReturnType<typeof signal<boolean>>;
    active: ReturnType<typeof signal<boolean>>;
    busy: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    message: ReturnType<typeof signal<string | null>>;
    enable: jasmine.Spy;
    disable: jasmine.Spy;
    test: jasmine.Spy;
    refresh: jasmine.Spy;
  };

  beforeEach(async () => {
    client = {
      ready: signal(true),
      supported: signal(true),
      needsInstall: signal(false),
      permission: signal<NotificationPermission>('default'),
      enabled: signal(true),
      active: signal(false),
      busy: signal(false),
      error: signal<string | null>(null),
      message: signal<string | null>(null),
      enable: jasmine.createSpy('enable').and.resolveTo(),
      disable: jasmine.createSpy('disable').and.resolveTo(),
      test: jasmine.createSpy('test').and.resolveTo(),
      refresh: jasmine.createSpy('refresh').and.resolveTo(),
    };
    await TestBed.configureTestingModule({
      imports: [PushSettingsComponent, TranslateModule.forRoot()],
      providers: [{ provide: PushClientService, useValue: client }],
    }).compileComponents();
    fixture = TestBed.createComponent(PushSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => TestBed.resetTestingModule());

  function checkbox(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input[type="checkbox"]');
  }

  it('only refreshes on entry, never requests permission or sends a test automatically', () => {
    expect(client.refresh).toHaveBeenCalledTimes(1);
    expect(client.enable).not.toHaveBeenCalled();
    expect(client.test).not.toHaveBeenCalled();
    expect(checkbox().checked).toBeFalse();
  });

  it('enables only after an explicit opt-in click', () => {
    checkbox().click();
    expect(client.enable).toHaveBeenCalledTimes(1);
    expect(client.disable).not.toHaveBeenCalled();
  });

  it('disables an active subscription even if backend sending is disabled', () => {
    client.active.set(true);
    client.enabled.set(false);
    fixture.detectChanges();
    expect(checkbox().disabled).toBeFalse();
    checkbox().click();
    expect(client.disable).toHaveBeenCalledTimes(1);
  });

  it('blocks opt-in while loading, busy, unsupported, denied, or backend disabled', () => {
    for (const [state, value] of [
      [client.ready, false],
      [client.busy, true],
      [client.supported, false],
      [client.enabled, false],
      [client.needsInstall, true],
    ] as const) {
      const original = state();
      state.set(value);
      fixture.detectChanges();
      expect(checkbox().disabled).toBeTrue();
      state.set(original);
    }
    client.permission.set('denied');
    fixture.detectChanges();
    expect(checkbox().disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'notifications.settings.blocked',
    );
    expect(client.enable).not.toHaveBeenCalled();
  });

  it('shows the iOS installation hint before unsupported status', () => {
    client.needsInstall.set(true);
    client.supported.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'notifications.settings.installFirst',
    );
  });

  it('tests only an active subscription with granted permission on explicit click', () => {
    const test = fixture.nativeElement.querySelector(
      '[data-action="test"] button',
    ) as HTMLButtonElement;
    expect(test.disabled).toBeTrue();
    client.active.set(true);
    client.permission.set('granted');
    fixture.detectChanges();
    expect(test.disabled).toBeFalse();
    expect(test.type).toBe('button');
    test.click();
    expect(client.test).toHaveBeenCalledTimes(1);
  });

  it('translates service error and acceptance keys', () => {
    client.error.set('notifications.settings.testFailed');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('notifications.settings.testFailed');
    client.error.set(null);
    client.message.set('notifications.settings.testAccepted');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'notifications.settings.testAccepted',
    );
  });
});
