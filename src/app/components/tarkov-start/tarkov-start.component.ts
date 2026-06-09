import { afterRenderEffect, Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import { MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { TarkovInstanceService } from '../../core/services/tarkov-instance.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { AnsiToHtmlPipe } from '../../core/pipes/ansi-to-html.pipe';

@Component({
  selector: 'app-tarkov-start',
  templateUrl: './tarkov-start.component.html',
  styleUrls: ['./tarkov-start.component.scss'],
  imports: [MatIconButton, MatMiniFabButton, MatIcon, MatTooltip, AnsiToHtmlPipe],
})
export class TarkovStartComponent {
  private readonly tarkovInstanceService = inject(TarkovInstanceService);
  private readonly userSettingService = inject(UserSettingsService);

  readonly serverOutput = this.tarkovInstanceService.serverOutputSignal;
  readonly isServerRunning = this.tarkovInstanceService.isServerRunning;

  readonly autoScroll = signal(true);

  private readonly activeInstance = this.userSettingService.getActiveInstanceComputed;
  readonly hasActiveInstance = computed(() => !!this.activeInstance());
  readonly activeInstancePath = computed(() => this.activeInstance()?.sptRootDirectory ?? '');
  readonly activeInstanceName = computed(() => {
    const path = this.activeInstancePath();
    return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
  });

  private readonly consoleBody = viewChild<ElementRef<HTMLElement>>('consoleBody');

  constructor() {
    afterRenderEffect(() => {
      this.serverOutput();
      if (this.autoScroll()) {
        this.scrollToBottom();
      }
    });
  }

  start(): void {
    this.autoScroll.set(true);
    this.tarkovInstanceService.startServer();
  }

  stop(): void {
    this.tarkovInstanceService.stopServer();
  }

  scrollToBottom(): void {
    const element = this.consoleBody()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }

  onScroll(): void {
    const element = this.consoleBody()?.nativeElement;
    if (!element) {
      return;
    }

    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    this.autoScroll.set(distanceFromBottom < 24);
  }
}
