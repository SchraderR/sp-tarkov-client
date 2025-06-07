import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imagePathResolver',
})
export class ImagePathResolverPipe implements PipeTransform {
  transform(modImage: string): string {
    return `${environment.forgeStaticBasePath}/${modImage}`;
  }
}
