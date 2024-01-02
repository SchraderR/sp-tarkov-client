import { Component, inject } from '@angular/core';
import { AsyncPipe, CommonModule, NgIf, NgOptimizedImage } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, filter, Observable, startWith, switchMap } from 'rxjs';
import { AkiSearchService } from '../../core/services/aki-search.service';
import { ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Mod, ModSearch } from '../../core/models/mod';
import { IsAlreadyInstalledDirective } from '../../core/directives/is-already-installed.directive';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-mod-search',
  imports: [
    CommonModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    IsAlreadyInstalledDirective,
    MatTooltipModule,
  ],
  templateUrl: './mod-search.component.html',
  styleUrl: './mod-search.component.scss',
})
export class ModSearchComponent {
  #akiSearchService = inject(AkiSearchService);
  #modListService = inject(ModListService);

  searchControl = new FormControl('', Validators.minLength(2));
  filteredModItems: Observable<ModSearch[]>;
  modListSignal = this.#modListService.modListSignal;

  isInModList = (modName: string) => this.modListSignal().some(m => m.name === modName);

  constructor() {
    this.filteredModItems = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      filter(value => !!value?.trim() && this.searchControl.valid),
      switchMap(searchArgument => this.#akiSearchService.searchMods(searchArgument!))
    );
  }

  addModToModList(event: Event, mod: Mod) {
    event.stopPropagation();

    this.#modListService.addMod(mod);
  }

  removeModFromModlist(event: MouseEvent, mod: Mod) {
    event.stopPropagation();

    this.#modListService.removeMod(mod.name);
  }
}
