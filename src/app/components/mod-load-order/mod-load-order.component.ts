import { Component, DestroyRef, inject, NgZone, OnInit } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';
import { CommonModule } from '@angular/common';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

export interface ModLoadOrder {
  order: string[];
}

@Component({
  standalone: true,
  selector: 'app-mod-load-order',
  templateUrl: './mod-load-order.component.html',
  styleUrl: './mod-load-order.component.scss',
  imports: [CommonModule, DragDropModule],
})
export default class ModLoadOrderComponent implements OnInit {
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #destroyRef = inject(DestroyRef);

  modLoadOrder: ModLoadOrder = { order: [] };

  ngOnInit() {
    this.#electronService
      .sendEvent<string, string>('mod-load-order', this.#userSettingsService.getActiveInstance()?.sptRootDirectory)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(modLoadOrder => this.#ngZone.run(() => (this.modLoadOrder = JSON.parse(modLoadOrder.args))));
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.modLoadOrder.order, event.previousIndex, event.currentIndex);
  }
}
