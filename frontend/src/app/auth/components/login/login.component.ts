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

@Component({
  selector: 'ts-login',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  persistingService = inject(PersistingService);
  router = inject(Router);
  fb = inject(FormBuilder);

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
        if (error.status === 401) {
          this.authError = 'E-Mail oder Passwort ist nicht korrekt.';
        } else {
          this.authError =
            'Login ist momentan nicht moeglich. Bitte versuche es erneut.';
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
}
