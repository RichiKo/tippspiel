import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { UiPageHeaderComponent } from './ui-page-header.component';

describe('UiPageHeaderComponent', () => {
  let fixture: ComponentFixture<UiPageHeaderComponent>;
  let component: UiPageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UiPageHeaderComponent,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation('de', { common: { back: 'Zurueck' } }, true);
    translate.setTranslation('uk', { common: { back: 'Повернутися' } }, true);
    await firstValueFrom(translate.use('uk'));

    fixture = TestBed.createComponent(UiPageHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Ranking');
    fixture.detectChanges();
  });

  it('should render title', () => {
    const title = fixture.nativeElement.querySelector('.ui-page-header__title') as HTMLElement;

    expect(component).toBeTruthy();
    expect(title.textContent?.trim()).toBe('Ranking');
  });

  it('should emit back event when back button is clicked', () => {
    const backSpy = jasmine.createSpy('backSpy');
    component.back.subscribe(backSpy);

    fixture.componentRef.setInput('showBack', true);
    fixture.detectChanges();

    const backButton = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    ) as HTMLButtonElement;

    backButton.click();

    expect(backSpy).toHaveBeenCalledTimes(1);
  });

  it('should render translated default back label', () => {
    fixture.componentRef.setInput('showBack', true);
    fixture.detectChanges();

    const backButtonText = fixture.nativeElement.querySelector(
      '.ui-page-header__back button',
    )?.textContent as string;

    expect(backButtonText).toContain('Повернутися');
  });
});
