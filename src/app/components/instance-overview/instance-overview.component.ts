import { Component, inject } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-instance-overview',
  templateUrl: './instance-overview.component.html',
  styleUrl: './instance-overview.component.scss',
  imports: [RouterLink, MatButtonModule],
})
export default class InstanceOverviewComponent {
  #userSettingsService = inject(UserSettingsService);

  isActiveAkiInstanceAvailable = () => !!this.#userSettingsService.getActiveInstance();
}
