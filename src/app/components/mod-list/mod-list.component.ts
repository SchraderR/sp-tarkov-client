import { Component, inject } from '@angular/core';
import { ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { ModCardComponent } from '../mod-card/mod-card.component';

@Component({
  selector: 'app-mod-list',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NgForOf, NgOptimizedImage, ModCardComponent],
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
})
export default class ModListComponent {
  #modListService = inject(ModListService);
  modListSignal = this.#modListService.modListSignal();
}
