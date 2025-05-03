import { computed, Directive, inject, input } from '@angular/core';
import { ModListService } from '../services/mod-list.service';
import { Mod } from '../models/mod';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyStarted]',
  exportAs: 'isAlreadyStarted',
})
export class IsAlreadyStartedDirective {
  #modListService = inject(ModListService);

  readonly mod = input.required<Mod>();

  isAlreadyStarted = computed(() => this.checkModAlreadyStarted());

  private checkModAlreadyStarted() {
    const mod = this.#modListService.modListSignal().find(m => m.name === this.mod().name);
    if (!mod) {
      return false;
    }

    return mod.installProgress?.linkStep.start && !mod.installProgress?.completed && !mod.installProgress?.error;
  }
}
