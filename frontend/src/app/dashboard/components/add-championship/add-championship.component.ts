import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-championship',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-championship.component.html',
  styleUrl: './add-championship.component.scss',
})
export class AddChampionshipComponent {
  fb = new FormBuilder();
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(64)]],
    description: ['', [Validators.maxLength(256)]],
    image: ['', [Validators.required]],
    isPublic: [true],
    isActive: [true],
  });
  submitted = signal(false);

  onSubmit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    // Hier könnte später die Backend-Logik folgen
    alert('Championship erstellt! (Mock)');
    this.form.reset({ isPublic: true, isActive: true });
    this.submitted.set(false);
  }
}
