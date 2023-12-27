import { Component, Input } from '@angular/core';
import { ModItem } from '../../core/services/mod-list.service';
import { MatCardModule } from '@angular/material/card';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-mod-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
})
export class ModCardComponent {
  @Input({ required: true }) modItem!: ModItem;
}
