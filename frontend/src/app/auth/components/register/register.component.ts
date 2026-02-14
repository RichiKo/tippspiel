import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PersistingService } from '../../services/persisisting.service';

@Component({
  selector: 'ts-register',
  imports: [MaterialModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);
  persistingService = inject(PersistingService);

  switchMode = output<void>();

  isSubmitting = false;
  hasSubmitted = false;
  showPassword = false;
  showConfirmPassword = false;
  authError: string | null = null;
  passwordMismatchError: string | null = null;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  onRegister(): void {
    this.hasSubmitted = true;
    this.authError = null;
    this.passwordMismatchError = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { username, email, password, confirmPassword } =
      this.form.getRawValue();
    if (password !== confirmPassword) {
      this.passwordMismatchError = 'Die Passwoerter stimmen nicht ueberein.';
      return;
    }

    this.isSubmitting = true;
    this.authService.register(username, email, password).subscribe({
      next: (user) => {
        this.persistingService.save(user.user);
        this.router.navigate(['/dashboard']);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          this.authError = 'Benutzername oder E-Mail ist bereits vergeben.';
        } else {
          this.authError =
            'Registrierung ist momentan nicht moeglich. Bitte versuche es erneut.';
        }
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  toLogin(): void {
    this.switchMode.emit();
  }

  shouldShowError(
    controlName: 'username' | 'email' | 'password' | 'confirmPassword',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.hasSubmitted);
  }

  get passwordStrength(): number {
    const value = this.form.controls.password.value;
    let score = 0;

    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    return score;
  }
}
