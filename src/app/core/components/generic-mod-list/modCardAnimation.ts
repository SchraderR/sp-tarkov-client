import { animate, state, style, transition, trigger } from '@angular/animations';

export const modCardAnimation = trigger('modCardExtended', [
  state('normal', style({ flex: '0 0 calc(33.333% - 16px)' })),
  state('extended', style({ flex: '0 0 calc(100% - 16px)' })),
  transition('* => *', [animate('0.25s')]),
]);
