import { environment } from '../../../environments/environment';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'imagePathResolver',
})
export class ImagePathResolverPipe implements PipeTransform {
  private readonly placeholderImagePath = 'assets/images/placeholder.png';
  transform(modImage?: string): string {
    if (!modImage) {
      return this.placeholderImagePath;
    }

    return `${environment.forgeStaticBasePath}/${modImage}`;
  }
}
