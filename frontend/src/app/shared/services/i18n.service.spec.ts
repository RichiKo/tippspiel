import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { appConfig } from '../../app.config';
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

describe('App translation loader', () => {
  let loader: TranslateLoader;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    loader = TestBed.inject(TranslateLoader);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('adds a cache-busting version to translation asset requests', () => {
    loader.getTranslation('uk').subscribe();

    const requests = httpTesting.match(() => true);
    const ukrainianRequests = requests.filter((request) =>
      request.request.url.includes('/uk.json'),
    );

    expect(ukrainianRequests.length).toBeGreaterThan(0);
    expect(
      ukrainianRequests.every(
        (request) =>
          request.request.urlWithParams ===
          './assets/i18n/uk.json?v=20260724',
      ),
    ).toBeTrue();
    requests.forEach((request) => request.flush({}));
  });
});
