import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PersistingService } from '../../auth/services/persisisting.service';
import { RoundDialogComponent } from '../../championship/components/round-dialog/round-dialog.component';
import { NotificationApiService } from '../notification-api.service';
import { RoundNotificationStatus } from '../notification.types';

describe('RoundDialogComponent notifications', () => {
  let fixture: ComponentFixture<RoundDialogComponent>;
  let api: jasmine.SpyObj<NotificationApiService>;
  const status: RoundNotificationStatus = {
    enabled: true,
    recipientUsers: 1,
    recipientDevices: 1,
    announced: false,
    previews: {
      new_round: { title: 'League', body: 'New round' },
      round_results: { title: 'League', body: 'Results' },
    },
    dispatches: [],
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<NotificationApiService>(
      'NotificationApiService',
      ['roundStatus', 'send'],
    );
    api.roundStatus.and.resolveTo(status);
    api.send.and.resolveTo(null);
    await TestBed.configureTestingModule({
      imports: [RoundDialogComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NotificationApiService, useValue: api },
        {
          provide: PersistingService,
          useValue: { currentUser: signal({ id: 1, role: 'admin' }) },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RoundDialogComponent);
  });

  afterEach(() => TestBed.resetTestingModule());

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('does not instantiate the notification action in create mode or while closed', async () => {
    await render();
    fixture.componentRef.setInput('visible', true);
    await render();
    expect(
      fixture.nativeElement.querySelector('app-round-notification-action'),
    ).toBeNull();
    expect(api.roundStatus).not.toHaveBeenCalled();
  });

  it('announces an edited round independently of required form fields and saving', async () => {
    fixture.componentRef.setInput('roundId', 'round-1');
    fixture.componentRef.setInput('visible', true);
    await render();
    const action = fixture.nativeElement.querySelector(
      'app-round-notification-action',
    ) as HTMLElement;
    expect(action.closest('form')).toBeNull();
    expect(fixture.componentInstance.name).toBe('');
    expect(api.roundStatus).toHaveBeenCalledOnceWith('round-1');
    (
      action.querySelector(
        '[data-action="preview"] button',
      ) as HTMLButtonElement
    ).click();
    await render();
    const saved = jasmine.createSpy('saved');
    fixture.componentInstance.confirmed.subscribe(saved);
    (
      action.querySelector('[data-action="send"] button') as HTMLButtonElement
    ).click();
    await render();
    expect(api.send).toHaveBeenCalledWith(
      'round-1',
      'new_round',
      jasmine.any(String),
    );
    expect(saved).not.toHaveBeenCalled();
  });
});
