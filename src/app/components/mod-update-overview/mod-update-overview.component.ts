import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { UpdateModMeta } from '../../../../shared/models/user-setting.model';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
})
export default class ModUpdateOverviewComponent implements OnInit {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.getCurrentModMetaData();
  }

  private getCurrentModMetaData() {
    this.#electronService.sendEvent<UpdateModMeta[]>('update-mod-data').subscribe(async () => {
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
