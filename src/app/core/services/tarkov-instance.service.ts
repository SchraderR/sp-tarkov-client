import { inject, Injectable, NgZone, signal } from '@angular/core';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';

@Injectable({
  providedIn: 'root',
})
export class TarkovInstanceService {
  private readonly electronService = inject(ElectronService);
  private readonly userSettingService = inject(UserSettingsService);
  private readonly ngZone = inject(NgZone);

  private serverOutput = signal<string[]>([]);
  readonly serverOutputSignal = this.serverOutput.asReadonly();

  private serverRunning = signal(false);
  readonly isServerRunning = this.serverRunning.asReadonly();

  private lastMessage = '';
  private lastMessageCount = 0;

  constructor() {
    this.electronService.getServerOutput().subscribe(outputLine => this.ngZone.run(() => this.addToServerOutput(outputLine)));

    this.electronService.getServerExit().subscribe(code =>
      this.ngZone.run(() => {
        this.serverRunning.set(false);
        this.addToServerOutput(`Server stopped (code ${code ?? 0})`);
      })
    );
  }

  startServer(): void {
    const activeInstance = this.userSettingService.getActiveInstance();
    if (!activeInstance || this.serverRunning()) {
      return;
    }

    this.serverRunning.set(true);
    this.electronService.sendEvent<void, string>('server-start', activeInstance.sptRootDirectory).subscribe();
  }

  stopServer(): void {
    if (!this.serverRunning()) {
      return;
    }

    this.electronService.sendEvent('server-stop').subscribe();
  }

  private addToServerOutput(text: string) {
    if (text === this.lastMessage) {
      this.lastMessageCount++;
    } else {
      this.lastMessage = text;
      this.lastMessageCount = 1;
    }

    this.serverOutput.update(output => {
      if (this.lastMessageCount > 1 && output.length > 0) {
        output[output.length - 1] = `${this.lastMessage} (x${this.lastMessageCount})`;
      } else {
        output.push(this.lastMessage);
      }
      return [...output];
    });
  }
}
