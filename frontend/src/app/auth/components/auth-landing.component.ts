import { Component } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { MaterialModule } from '../../material.module';

@Component({
  selector: 'app-auth-landing',
  standalone: true,
  imports: [LoginComponent, RegisterComponent, MaterialModule],
  templateUrl: './auth-landing.component.html',
  styleUrls: ['./auth-landing.component.scss'],
})
export class AuthLandingComponent {
  showLogin = true;
  switchToRegister() {
    this.showLogin = false;
  }
  switchToLogin() {
    this.showLogin = true;
  }
}
