import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { PersistingService } from '../../services/persisisting.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  const navigateSpy = jasmine.createSpy('navigate');
  const saveSpy = jasmine.createSpy('save');
  const loginSpy = jasmine
    .createSpy('login')
    .and.returnValue(of({ user: { id: 1, token: 'abc' } }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [
        { provide: AuthService, useValue: { login: loginSpy } },
        { provide: PersistingService, useValue: { save: saveSpy } },
        { provide: Router, useValue: { navigate: navigateSpy } },
      ],
    }).compileComponents();

    const translate = TestBed.inject(TranslateService);
    translate.setDefaultLang('de');
    translate.setTranslation(
      'uk',
      {
        auth: {
          login: {
            submit: 'Увійти',
            errors: {
              invalidCredentials: 'Неправильна електронна пошта або пароль.',
              general: 'Зараз неможливо увійти. Спробуйте пізніше.',
            },
          },
        },
      },
      true,
    );
    await firstValueFrom(translate.use('uk'));

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders translated submit label', () => {
    const submitButton = fixture.nativeElement.querySelector(
      '.auth-submit',
    ) as HTMLButtonElement;

    expect(submitButton.textContent).toContain('Увійти');
  });

  it('maps 401 response to translated auth error message', () => {
    loginSpy.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
          }),
      ),
    );

    component.form.setValue({ email: 'a@b.de', password: 'secret1' });
    component.onLogin();

    expect(component.authError).toBe(
      'Неправильна електронна пошта або пароль.',
    );
  });

  it('maps 422 response to translated auth error message', () => {
    loginSpy.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
          }),
      ),
    );

    component.form.setValue({ email: 'missing@user.de', password: 'secret1' });
    component.onLogin();

    expect(component.authError).toBe(
      'Неправильна електронна пошта або пароль.',
    );
  });

  it('maps 400 response to translated auth error message', () => {
    loginSpy.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
          }),
      ),
    );

    component.form.setValue({ email: 'missing@user.de', password: 'secret1' });
    component.onLogin();

    expect(component.authError).toBe(
      'Неправильна електронна пошта або пароль.',
    );
  });
});
