import { animate, state, style, transition, trigger } from '@angular/animations';

export const fadeInFadeOutAnimation = trigger('fadeInOut', [
  state('void', style({ opacity: 0 })),
  transition('void => *', animate(250)),
  transition('* => void', animate(0)),
]);
