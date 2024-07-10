import { Component, DestroyRef, inject, NgZone, OnInit } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../core/services/electron.service';
import { TarkovInstanceService } from '../../core/services/tarkov-instance.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-tarkov-start',
  templateUrl: './tarkov-start.component.html',
  styleUrls: ['./tarkov-start.component.scss'],
  imports: [CommonModule, MatButton],
})
export class TarkovStartComponent implements OnInit {
  #userSettingService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #tarkovInstanceService = inject(TarkovInstanceService);
  #ngZone = inject(NgZone);
  #destroyRef = inject(DestroyRef);

  private messagesCount = new Map<string, number>();
  private lastMessage = '';

  serverOutput = this.#tarkovInstanceService.serverOutputSignal;

  ngOnInit(): void {
    this.#electronService
      .getServerOutput()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(outputLine => {
        this.#ngZone.run(() => {
          // a lot of magic ansi code replace
          // eslint-disable-next-line no-control-regex
          const cleanedOutputLine = outputLine.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
          this.#tarkovInstanceService.addToServerOutput(cleanedOutputLine);
        });
      });
  }

  startInstanceServer(): void {
    const activeInstance = this.#userSettingService.getActiveInstance();
    if (!activeInstance) {
      return;
    }

    this.#electronService.sendEvent<void, string>('tarkov-start', activeInstance.sptRootDirectory).subscribe();
  }
}
