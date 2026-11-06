import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { CurrentUserInterface } from '../../../shared/types/current-user.interface';
import { NotificationApiService } from '../../notification-api.service';
import {
  DispatchSummary,
  RoundNotificationStatus,
} from '../../notification.types';
import { RoundNotificationActionComponent } from './round-notification-action.component';

describe('RoundNotificationActionComponent', () => {
  let fixture: ComponentFixture<RoundNotificationActionComponent>;
  let api: jasmine.SpyObj<NotificationApiService>;
  const user: CurrentUserInterface = {
    id: 1,
    username: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    image: null,
    token: '',
  };
  const currentUser = signal<CurrentUserInterface | null>(null);
  const dispatch: DispatchSummary = {
    id: 'dispatch-1',
    type: 'round_results',
    createdAt: '2026-11-05T12:00:00Z',
    recipientCount: 3,
    accepted: 1,
    failed: 1,
    pending: 1,
    expired: 0,
    skipped: 0,
    inProgress: false,
    canRetry: true,
  };
  let status: RoundNotificationStatus;

  beforeEach(async () => {
    currentUser.set(user);
    status = {
      enabled: true,
      recipientUsers: 2,
      recipientDevices: 3,
      announced: false,
      previews: {
        new_round: { title: 'League', body: 'New round' },
        round_results: { title: 'League', body: 'Results updated' },
      },
      dispatches: [],
    };
    api = jasmine.createSpyObj<NotificationApiService>(
      'NotificationApiService',
      ['roundStatus', 'send', 'retry'],
    );
    api.roundStatus.and.callFake(async () => status);
    api.send.and.resolveTo(dispatch);
    api.retry.and.resolveTo({
      ...dispatch,
      accepted: 3,
      failed: 0,
      pending: 0,
      canRetry: false,
    });
    await TestBed.configureTestingModule({
      imports: [RoundNotificationActionComponent, TranslateModule.forRoot()],
      providers: [
        { provide: NotificationApiService, useValue: api },
        { provide: PersistingService, useValue: { currentUser } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RoundNotificationActionComponent);
    fixture.componentRef.setInput('roundId', 'round-1');
    fixture.componentRef.setInput('type', 'round_results');
  });

  afterEach(() => TestBed.resetTestingModule());

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function open(): Promise<void> {
    fixture.componentRef.setInput('visible', true);
    await render();
  }

  function button(action: string): HTMLButtonElement | null {
    return fixture.nativeElement.querySelector(
      `[data-action="${action}"] button`,
    );
  }

  async function preview(): Promise<void> {
    button('preview')!.click();
    await render();
  }

  async function send(): Promise<void> {
    button('send')!.click();
    await render();
  }

  it('does not fetch while hidden or without a round id', async () => {
    await render();
    expect(api.roundStatus).not.toHaveBeenCalled();
    fixture.componentRef.setInput('roundId', null);
    await open();
    expect(api.roundStatus).not.toHaveBeenCalled();
    expect(button('preview')).toBeNull();
  });

  it('does not fetch or render for ordinary users or championship owners', async () => {
    for (const role of ['user', 'owner']) {
      currentUser.set({ ...user, role });
      await open();
      expect(api.roundStatus).not.toHaveBeenCalled();
      expect(button('preview')).toBeNull();
    }
  });

  it('fetches for super admins only on opening and never sends automatically', async () => {
    currentUser.set({ ...user, role: 'super_admin' });
    await open();
    await render();
    expect(api.roundStatus).toHaveBeenCalledOnceWith('round-1');
    expect(api.send).not.toHaveBeenCalled();
    fixture.componentRef.setInput('visible', false);
    await render();
    await open();
    expect(api.roundStatus).toHaveBeenCalledTimes(2);
  });

  it('shows an inline preview and counts before an explicit send', async () => {
    await open();
    await preview();
    expect(fixture.nativeElement.textContent).toContain('Results updated');
    expect(
      fixture.nativeElement.querySelector('[data-testid="recipient-users"]')
        .textContent,
    ).toContain('2');
    expect(
      fixture.nativeElement.querySelector('[data-testid="recipient-devices"]')
        .textContent,
    ).toContain('3');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(button('send')!.type).toBe('button');
    expect(api.send).not.toHaveBeenCalled();
    await send();
    expect(api.send).toHaveBeenCalledWith(
      'round-1',
      'round_results',
      jasmine.any(String),
    );
    expect(button('send')).toBeNull();
  });

  it('cancels the preview without sending', async () => {
    await open();
    await preview();
    button('cancel')!.click();
    await render();
    expect(button('send')).toBeNull();
    expect(api.send).not.toHaveBeenCalled();
  });

  it('blocks an already announced new round but allows further result batches', async () => {
    status.announced = true;
    fixture.componentRef.setInput('type', 'new_round');
    await open();
    expect(button('preview')!.disabled).toBeTrue();
    fixture.componentRef.setInput('type', 'round_results');
    await render();
    expect(button('preview')!.disabled).toBeFalse();
  });

  it('blocks sends with a disabled backend or no recipients', async () => {
    status.enabled = false;
    await open();
    expect(button('preview')!.disabled).toBeTrue();
    status = {
      ...status,
      enabled: true,
      recipientUsers: 0,
      recipientDevices: 0,
    };
    button('refresh')!.click();
    await render();
    expect(button('preview')!.disabled).toBeTrue();
    expect(api.send).not.toHaveBeenCalled();
  });

  it('retains the request id after a network error, including cancel and reopen of preview', async () => {
    api.send.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    await open();
    await preview();
    await send();
    const requestId = api.send.calls.mostRecent().args[2];
    button('cancel')!.click();
    await render();
    await preview();
    api.send.and.resolveTo(dispatch);
    await send();
    expect(api.send.calls.mostRecent().args[2]).toBe(requestId);
  });

  it('generates a new UUID for each deliberate successful results batch', async () => {
    await open();
    await preview();
    await send();
    await preview();
    await send();
    const [first, second] = api.send.calls.allArgs().map((args) => args[2]);
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i);
    expect(second).not.toBe(first);
  });

  it('retains an uncertain request across closing and recreating the dialog component', async () => {
    api.send.and.rejectWith(new HttpErrorResponse({ status: 0 }));
    await open();
    await preview();
    await send();
    const requestId = api.send.calls.mostRecent().args[2];
    fixture.destroy();
    fixture = TestBed.createComponent(RoundNotificationActionComponent);
    fixture.componentRef.setInput('roundId', 'round-1');
    fixture.componentRef.setInput('type', 'round_results');
    await open();
    await preview();
    api.send.and.resolveTo(dispatch);
    await send();
    expect(api.send.calls.mostRecent().args[2]).toBe(requestId);
  });

  it('guards a double click during an in-flight send', async () => {
    let resolve: (value: DispatchSummary) => void = () =>
      fail('missing resolver');
    api.send.and.returnValue(
      new Promise<DispatchSummary>((done) => {
        resolve = done;
      }),
    );
    await open();
    await preview();
    const first = fixture.componentInstance.send();
    await fixture.componentInstance.send();
    expect(api.send).toHaveBeenCalledTimes(1);
    resolve(dispatch);
    await first;
    await render();
  });

  it('summarizes deliveries and retries only the selected existing dispatch', async () => {
    status.dispatches = [
      dispatch,
      { ...dispatch, id: 'announcement', type: 'new_round' },
    ];
    await open();
    expect(fixture.nativeElement.querySelectorAll('.dispatch').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain(
      'notifications.admin.accepted',
    );
    button('retry')!.click();
    await render();
    expect(api.retry).toHaveBeenCalledOnceWith('dispatch-1');
    expect(api.send).not.toHaveBeenCalled();
    expect(button('retry')).toBeNull();
  });

  it('shows load failures and supports explicit refresh', async () => {
    api.roundStatus.and.rejectWith(new Error('offline'));
    await open();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toContain('notifications.admin.loadFailed');
    api.roundStatus.and.resolveTo(status);
    button('refresh')!.click();
    await render();
    expect(button('preview')!.disabled).toBeFalse();
  });

  it('ignores stale status from another round', async () => {
    let resolve: (value: RoundNotificationStatus) => void = () =>
      fail('missing resolver');
    api.roundStatus.and.returnValue(
      new Promise<RoundNotificationStatus>((done) => {
        resolve = done;
      }),
    );
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    api.roundStatus.and.resolveTo(status);
    fixture.componentRef.setInput('roundId', 'round-2');
    fixture.detectChanges();
    resolve({ ...status, enabled: false });
    await render();
    expect(button('preview')!.disabled).toBeFalse();
  });

  it('revokes all actions immediately when the role changes', async () => {
    await open();
    await preview();
    currentUser.set({ ...user, role: 'user' });
    await fixture.componentInstance.send();
    await render();
    expect(api.send).not.toHaveBeenCalled();
    expect(button('preview')).toBeNull();
  });
});
