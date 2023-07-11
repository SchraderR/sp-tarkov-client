import { BrowserWindow } from 'electron';

export class BrowserWindowSingleton {
  private static instance: BrowserWindow;

  static getInstance(): BrowserWindow {
    return this.instance;
  }

  static setInstance(browserWindow: BrowserWindow): void {
    this.instance = browserWindow;
  }
}
