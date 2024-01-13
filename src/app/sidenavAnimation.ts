import { animate, state, style, transition, trigger } from '@angular/animations';

export const sidenavAnimation = trigger('openClose', [
  state('open', style({ width: '250px' })),
  state('closed', style({ width: '55px' })),
  transition('* => *', [animate('0.1s')]),
]);
