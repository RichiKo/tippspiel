import { Component, inject, effect } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { MaterialModule } from './material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HeaderComponent } from './shared/components/header/header.component';
import { PersistingService } from './auth/services/persisisting.service';
import { SeoService } from './shared/services/seo.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterOutlet,
    HeaderComponent,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'TippsLiga';
  private readonly persistingService = inject(PersistingService);
  private readonly seoService = inject(SeoService);
  readonly currentUser = this.persistingService.currentUser;

  constructor() {
    this.seoService.init();

    // Add/remove body class based on authentication status
    effect(() => {
      const user = this.currentUser();
      if (user) {
        document.body.classList.add('has-header');
      } else {
        document.body.classList.remove('has-header');
      }
    });
  }
}
