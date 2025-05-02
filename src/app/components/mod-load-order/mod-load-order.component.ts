import { Component, DestroyRef, inject, NgZone, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';
import { CommonModule } from '@angular/common';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

export interface ModLoadOrder {
  order: string[];
}

@Component({
  selector: 'app-mod-load-order',
  templateUrl: './mod-load-order.component.html',
  styleUrl: './mod-load-order.component.scss',
  imports: [CommonModule, DragDropModule, MatButton, MatCard, MatCardActions, MatCardContent],
})
export default class ModLoadOrderComponent implements OnInit {
  @ViewChild('modLoadOrderWarning', { static: true }) modLoadOrderWarning!: TemplateRef<unknown>;

  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #destroyRef = inject(DestroyRef);
  #matDialog = inject(MatDialog);

  modLoadOrderWarningDialog!: MatDialogRef<unknown, unknown>;
  modLoadOrder: ModLoadOrder = { order: [] };
  wasModLoadOrderWarningReviewed = this.#userSettingsService.wasModLoadOrderWarningReviewed;

  ngOnInit() {
    if (!this.#userSettingsService.wasModLoadOrderWarningReviewed()) {
      this.openModLoadOrderDialog();
    }

    const instancePath = this.#userSettingsService.getActiveInstance()?.sptRootDirectory;
    if (!instancePath) {
      return;
    }

    this.#electronService
      .sendEvent<string, string>('mod-load-order', instancePath)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(modLoadOrder => this.#ngZone.run(() => (this.modLoadOrder = JSON.parse(modLoadOrder.args))));
  }

  drop(event: CdkDragDrop<string[]>) {
    const instancePath = this.#userSettingsService.getActiveInstance()?.sptRootDirectory;
    if (!instancePath) {
      return;
    }

    moveItemInArray(this.modLoadOrder.order, event.previousIndex, event.currentIndex);

    this.#electronService
      .sendEvent<void, { instancePath: string; modLoadOrder: string[] }>('save-mod-load-order', {
        instancePath,
        modLoadOrder: this.modLoadOrder.order,
      })
      .subscribe();
  }

  closeModLoadOrderDialog() {
    this.modLoadOrderWarningDialog.close();
    this.#userSettingsService.wasModLoadOrderWarningReviewed.update(() => true);
  }

  private openModLoadOrderDialog() {
    this.modLoadOrderWarningDialog = this.#matDialog.open(this.modLoadOrderWarning, {
      disableClose: true,
      width: '50%',
    });
  }
}
