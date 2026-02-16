import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PersistingService } from '../../../auth/services/persisisting.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;

  const navigateSpy = jasmine.createSpy('navigate');
  const clearSpy = jasmine.createSpy('clear');

  const persistingServiceMock = {
    currentUser: signal({
      id: 1,
      username: 'Admin',
      email: 'admin@test.com',
      role: 'admin',
      image: null,
      token: 'token',
    }),
    clear: clearSpy,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        { provide: Router, useValue: { navigate: navigateSpy } },
        { provide: PersistingService, useValue: persistingServiceMock },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'uk',
      {
        header: {
          brand: 'TippsLiga',
          settings: 'Налаштування',
          logout: 'Вийти',
          menu: {
            open: 'Відкрити меню',
            close: 'Закрити меню',
          },
          logoutDialog: {
            title: 'Вийти',
            message: 'Ви дійсно хочете вийти?',
            confirm: 'Вийти',
            cancel: 'Скасувати',
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('uk'));

    fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
  });

  it('renders translated header actions', () => {
    const content = fixture.nativeElement.textContent as string;
    const settingsButton = fixture.nativeElement.querySelector(
      '.settings-btn',
    ) as HTMLButtonElement;
    const logoImage = fixture.nativeElement.querySelector('.logo-mark') as HTMLImageElement;
    const logoHighlight = fixture.nativeElement.querySelector(
      '.logo-text__highlight',
    ) as HTMLElement | null;

    expect(content).toContain('Вийти');
    expect(content).toContain('TippsLiga');
    expect(logoImage).not.toBeNull();
    expect(logoHighlight).not.toBeNull();
    expect(logoHighlight?.textContent?.trim()).toBe('Liga');
    expect(logoImage.getAttribute('src')).toContain('assets/branding/tippsliga-logo-mark.png');
    expect(settingsButton.getAttribute('aria-label')).toBe('Налаштування');
  });
});
