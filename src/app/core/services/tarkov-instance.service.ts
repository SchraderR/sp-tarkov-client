import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TarkovInstanceService {
  private serverOutput = signal<string[]>([]);
  readonly serverOutputSignal = this.serverOutput.asReadonly();

  private lastMessage = '';
  private lastMessageCount: number = 0;

  addToServerOutput(text: string) {
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
