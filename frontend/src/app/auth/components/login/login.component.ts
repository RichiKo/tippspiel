import { DOCUMENT } from '@angular/common';
import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from '../../services/auth.service';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PersistingService } from '../../services/persisisting.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ts-login',
  imports: [MaterialModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  persistingService = inject(PersistingService);
  router = inject(Router);
  fb = inject(FormBuilder);
  translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  switchMode = output<void>();

  isSubmitting = false;
  showPassword = false;
  hasSubmitted = false;
  authError: string | null = null;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onLogin(): void {
    this.hasSubmitted = true;
    this.authError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.isSubmitting = true;
    this.blurActiveElement();

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.persistingService.save(user.user);
        this.blurActiveElement();
        this.router.navigate(['/dashboard']).then(() => {
          this.resetViewportPosition();
        });
      },
      error: (error: HttpErrorResponse) => {
        this.authError = this.resolveAuthErrorMessage(error);
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  toRegister(): void {
    this.switchMode.emit();
  }

  shouldShowError(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.hasSubmitted);
  }

  private blurActiveElement(): void {
    const activeElement = this.document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
  }

  private resetViewportPosition(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);
  }

  private resolveAuthErrorMessage(error: HttpErrorResponse): string {
    const rawMessage = error.error?.message;
    const messages = Array.isArray(rawMessage)
      ? rawMessage
      : typeof rawMessage === 'string'
        ? [rawMessage]
        : [];
    const normalizedMessages = messages.map((message) =>
      message.toLowerCase(),
    );

    if (
      normalizedMessages.some((message) => message.includes('email must be an email'))
    ) {
      return this.translate.instant('auth.login.emailInvalid');
    }

    if (error.status === 400 || error.status === 401 || error.status === 422) {
      return this.translate.instant('auth.login.errors.invalidCredentials');
    }

    if (
      normalizedMessages.some((message) =>
        message.includes('credentials are not valid'),
      )
    ) {
      return this.translate.instant('auth.login.errors.invalidCredentials');
    }

    return this.translate.instant('auth.login.errors.general');
  }
}
