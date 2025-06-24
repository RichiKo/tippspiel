import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PersistingService } from '../../services/persisisting.service';

@Component({
  selector: 'ts-login',
  imports: [RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authService = inject(AuthService);
  persistingService = inject(PersistingService);
  router = inject(Router);
  fb = inject(FormBuilder);

  form = this.fb.group({
    email: [''],
    password: [''],
  });

  onLogin(): void {
    const { email, password } = this.form.value;

    if (!email || !password) {
      console.log('*[ no password or email ]');
      return;
    }

    this.authService.login(email, password).subscribe((user) => {
      this.persistingService.save(user.user);
      this.router.navigate(['/home']);
    });
  }

  toRegister(): void {
    this.router.navigate(['/register']);
  }
}
