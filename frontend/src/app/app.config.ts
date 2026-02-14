import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { firstValueFrom, Observable } from 'rxjs';
import {
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';

class AppTranslateLoader implements TranslateLoader {
  constructor(private readonly http: HttpClient) {}

  getTranslation(language: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`./assets/i18n/${language}.json`);
  }
}

function createTranslateLoader(http: HttpClient): TranslateLoader {
  return new AppTranslateLoader(http);
}

function initializeTranslations(translate: TranslateService): () => Promise<unknown> {
  return () => {
    translate.setDefaultLang('de');
    return firstValueFrom(translate.use('uk'));
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      FormsModule,
      ReactiveFormsModule,
      MaterialModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient],
        },
      }),
    ),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initializeTranslations,
      deps: [TranslateService],
    },
  ],
};
