import { Component, inject, OnInit } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';
import { UpdateModMeta } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { UserSettingsService } from '../../core/services/user-settings.service';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
  imports: [CommonModule, MatCardModule],
})
export default class ModUpdateOverviewComponent implements OnInit {
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);

  activeInstance = this.#userSettingsService.getActiveInstance();

  ngOnInit() {
    this.getCurrentModMetaData();
  }

  private getCurrentModMetaData() {
    if (!this.activeInstance) {
      return;
    }

    this.#electronService
      .sendEvent<UpdateModMeta[], string>('update-mod-data', this.activeInstance.sptRootDirectory ?? this.activeInstance.akiRootDirectory)
      .subscribe(async () => {
        // https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
        // https://hub.sp-tarkov.com/files/
        // file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
        //this.#httpClient
        //  .get(`${environment.akiFileBaseLink}/file/1062/#versions`, { observe: 'response', responseType: 'text' })
        //  .pipe(
        //    catchError(e => {
        //      console.log(e);
        //      console.log(e['headers']);
        //      return e;
        //    })
        //  )
        //  .subscribe(resp => {
        //    //console.log(resp);
        //    //console.log(resp['headers']);
        //    //if (resp.url != null) {
        //    //  // window.location.href = resp.url;
        //    //}
        //  });
        //
        //this.#httpClient
        //  .get(`files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions`, {
        //
        //    responseType: 'text',
        //  })
        //  .pipe(takeUntilDestroyed(this.#destroyRef))
        //  .subscribe(r => console.log(r));
      });
  }
}
