import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import Anser from 'anser';

@Pipe({
  name: 'ansiToHtml',
})
export class AnsiToHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(line?: string | null): SafeHtml {
    const html = Anser.ansiToHtml(Anser.escapeForHtml(line ?? ''), { use_classes: false });
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
