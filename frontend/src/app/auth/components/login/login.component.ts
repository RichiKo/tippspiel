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

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.persistingService.save(user.user);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        if (this.isInvalidCredentialsError(error)) {
          this.authError = this.translate.instant(
            'auth.login.errors.invalidCredentials',
          );
        } else {
          this.authError = this.translate.instant('auth.login.errors.general');
        }
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

  private isInvalidCredentialsError(error: HttpErrorResponse): boolean {
    if (error.status === 400 || error.status === 401 || error.status === 422) {
      return true;
    }

    const rawMessage = error.error?.message;
    const messages = Array.isArray(rawMessage)
      ? rawMessage
      : typeof rawMessage === 'string'
        ? [rawMessage]
        : [];
    const normalizedMessages = messages.map((message) =>
      message.toLowerCase(),
    );

    return normalizedMessages.some(
      (message) =>
        message.includes('credentials are not valid') ||
        message.includes('email must be an email'),
    );
  }
}
