import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../../../material.module';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PersistingService } from '../../services/persisisting.service';

@Component({
  selector: 'ts-register',
  imports: [RouterModule, MaterialModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  authService = inject(AuthService);
  router = inject(Router);
  fb = inject(FormBuilder);
  persistingService = inject(PersistingService);

  form = this.fb.group({
    username: [''],
    email: [''],
    password: [''],
  });

  onRegister(): void {
    const { username, email, password } = this.form.value;

    if (!username || !email || !password) {
      console.log('*[ no username, password or email ]');
      return;
    }

    this.authService.register(username, email, password).subscribe((user) => {
      this.persistingService.save(user.user);
      this.router.navigate(['/home']);
    });
  }

  toLogin(): void {
    this.router.navigate(['/login']);
  }
}
