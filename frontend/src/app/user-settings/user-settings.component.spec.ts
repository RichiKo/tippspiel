import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { UserSettingsComponent } from './user-settings.component';
import { PersistingService } from '../auth/services/persisisting.service';
import { UserService } from '../shared/services/user.service';
import { PushClientService } from '../notifications/push-client.service';

describe('UserSettingsComponent', () => {
  let component: UserSettingsComponent;
  let fixture: ComponentFixture<UserSettingsComponent>;

  const navigateSpy = jasmine.createSpy('navigate');
  const pushClient = {
    ready: signal(true), supported: signal(true), needsInstall: signal(false),
    permission: signal<NotificationPermission>('granted'), enabled: signal(true),
    active: signal(false), busy: signal(false), error: signal<string | null>(null),
    message: signal<string | null>(null),
    refresh: jasmine.createSpy('refresh').and.resolveTo(),
    enable: jasmine.createSpy('enable').and.resolveTo(),
    disable: jasmine.createSpy('disable').and.resolveTo(true),
    test: jasmine.createSpy('test').and.resolveTo(),
  };

  const mockPersistingService = {
    currentUser: signal({
      id: 1,
      username: 'Richi',
      email: 'richi@test.com',
      role: 'user',
      image: null,
      token: 'token',
    }),
  };

  const mockUserService = {
    uploadUserImage: jasmine.createSpy('uploadUserImage').and.returnValue(
      of({ url: 'https://example.com/user.png' }),
    ),
    updateUser: jasmine.createSpy('updateUser').and.returnValue(
      of({
        user: {
          id: 1,
          username: 'Richi',
          email: 'richi@test.com',
          image: null,
          role: 'user',
          token: 'token',
        },
      }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserSettingsComponent, TranslateModule.forRoot()],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: PersistingService, useValue: mockPersistingService },
        { provide: UserService, useValue: mockUserService },
        { provide: PushClientService, useValue: pushClient },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render migrated settings header and form', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ui-page-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.settings-form')).toBeTruthy();
  });

  it('should navigate to dashboard on cancel', () => {
    component.onCancel();

    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('keeps push opt-in outside the profile form and independent of its validity', () => {
    component.email.set('invalid');
    fixture.detectChanges();
    const settings = fixture.nativeElement.querySelector('app-push-settings') as HTMLElement;
    const optIn = settings.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(settings.closest('form')).toBeNull();
    expect(component.isFormValid()).toBeFalse();
    expect(optIn.disabled).toBeFalse();
    optIn.click();
    expect(pushClient.enable).toHaveBeenCalled();
  });

  it('should call updateUser on save with valid data', async () => {
    component.username.set('Richi');
    component.email.set('richi@test.com');

    await component.onSave();

    expect(mockUserService.updateUser).toHaveBeenCalled();
  });
});
