import { Component, inject } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-instance-overview',
  templateUrl: './instance-overview.component.html',
  styleUrl: './instance-overview.component.scss',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinner],
})
export default class InstanceOverviewComponent {
  #userSettingsService = inject(UserSettingsService);

  activeAkiInstance = this.#userSettingsService.getActiveInstance();
}
