import { Component, inject } from '@angular/core';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, filter, Observable, startWith, switchMap } from 'rxjs';
import { ModSearchItem } from '../../app.component';
import { AkiSearchService } from '../../core/services/aki-search.service';

@Component({
  standalone: true,
  selector: 'app-mod-search',
  imports: [AsyncPipe, MatAutocompleteModule, MatFormFieldModule, MatInputModule, MatOptionModule, NgOptimizedImage, ReactiveFormsModule],
  templateUrl: './mod-search.component.html',
  styleUrl: './mod-search.component.scss',
})
export class ModSearchComponent {
  #akiSearchService = inject(AkiSearchService);

  searchControl = new FormControl('');
  filteredModItems: Observable<ModSearchItem[]>;

  constructor() {
    this.filteredModItems = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      filter(value => !!value),
      switchMap(searchArgument => this.#akiSearchService.searchMods(searchArgument!))
    );
  }
}
