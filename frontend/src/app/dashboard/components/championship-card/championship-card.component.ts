import { Component, input } from '@angular/core';
import { Championship } from '../../types/championship.interface';

@Component({
  selector: 'app-championship-card',
  imports: [],
  templateUrl: './championship-card.component.html',
  styleUrl: './championship-card.component.scss',
})
export class ChampionshipCardComponent {
  championship = input<Championship>();
}
