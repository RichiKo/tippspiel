import { TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
    }).compileComponents();

    service = TestBed.inject(I18nService);
    translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation('de', { common: { back: 'Zurueck' } }, true);
    translate.setTranslation('uk', { common: { back: 'Повернутися' } }, true);
    await firstValueFrom(translate.use('uk'));
  });

  it('returns uk as active and de as fallback for default setup', () => {
    expect(service.currentLanguage()).toBe('uk');
    expect(service.fallbackLanguage()).toBe('de');
  });

  it('switches language to de', async () => {
    await firstValueFrom(service.setLanguage('de'));

    expect(service.currentLanguage()).toBe('de');
  });
});
