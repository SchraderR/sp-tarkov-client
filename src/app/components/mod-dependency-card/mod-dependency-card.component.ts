import { Component, inject, input } from '@angular/core';
import { Mod } from '../../core/models/mod';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/services/electron.service';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { SemverSptVersionPipe } from '../../core/pipes/semver-spt-version.pipe';

@Component({
  selector: 'app-mod-dependency-card',
  imports: [MatCard, MatCardContent, MatIconModule, MatIconButton, MatProgressBar, SemverSptVersionPipe],
  templateUrl: './mod-dependency-card.component.html',
  styleUrls: ['./mod-dependency-card.component.scss', './../mod-card/mod-card.component.scss'],
  animations: [fadeInFadeOutAnimation],
})
export class ModDependencyCardComponent {
  #electronService = inject(ElectronService);

  readonly mod = input.required<Mod>();

  hovering = false;

  openExternal(fileUrl: string) {
    this.#electronService.openExternal(fileUrl);
  }
}
