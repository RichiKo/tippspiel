import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PersistingService } from '../auth/services/persisisting.service';
import { MaterialModule } from '../material.module';
import { CurrentUserInterface } from '../shared/types/current-user.interface';

@Component({
  selector: 'app-home',
  imports: [RouterModule, MaterialModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  currentUser: CurrentUserInterface | null = null;

  persistingService = inject(PersistingService);
  router = inject(Router);

  ngOnInit(): void {
    this.currentUser = this.persistingService.currentUser();

    console.log('*[ currentUser ]', this.currentUser);
  }

  logout(): void {
    this.persistingService.clear();
    this.router.navigate(['/login']);
  }
}
