import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'uk' | 'de';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);

  currentLanguage(): AppLanguage {
    const language = this.translate.currentLang;
    return language === 'de' ? 'de' : 'uk';
  }

  fallbackLanguage(): AppLanguage {
    return this.translate.getDefaultLang() === 'uk' ? 'uk' : 'de';
  }

  setLanguage(language: AppLanguage): Observable<unknown> {
    return this.translate.use(language);
  }
}
