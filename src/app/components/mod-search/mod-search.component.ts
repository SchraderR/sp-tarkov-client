import { Component, inject } from '@angular/core';
import { AsyncPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, filter, Observable, startWith, switchMap } from 'rxjs';
import { AkiSearchService } from '../../core/services/aki-search.service';
import { ModItem, ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-mod-search',
  imports: [
    AsyncPipe,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    NgIf,
  ],
  templateUrl: './mod-search.component.html',
  styleUrl: './mod-search.component.scss',
})
export class ModSearchComponent {
  #akiSearchService = inject(AkiSearchService);
  #modListService = inject(ModListService);

  searchControl = new FormControl('', Validators.minLength(2));
  filteredModItems: Observable<ModItem[]>;
  modListSignal = this.#modListService.modListSignal();

  isInModList = (modName: string) => this.modListSignal.some(m => m.modName === modName);

  constructor() {
    this.filteredModItems = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      filter(value => !!value?.trim() && this.searchControl.valid),
      switchMap(searchArgument => this.#akiSearchService.searchMods(searchArgument!))
    );
  }

  addModToModList(event: Event, mod: ModItem) {
    event.stopPropagation();

    this.#modListService.addModToModList(mod);
  }

  removeModFromModlist(event: MouseEvent, mod: ModItem) {
    event.stopPropagation();

    this.#modListService.deleteModToModList(mod);
  }
}
