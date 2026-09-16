import { Component, computed, input } from '@angular/core';

export const ICON_PATHS: Record<string, string> = {
  trending: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  cross: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z',
  bag: 'M6 7h12l1 13H5L6 7zM9 7a3 3 0 0 1 6 0',
  food: 'M5 3v8M5 11a3 3 0 0 0 6 0V3M8 14v7M17 3c-2 0-3 3-3 6 0 2 1 3 3 3v9M17 3v18',
  book: 'M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h13',
  heart: 'M12 20s-7-4.5-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.5-9 9-9 9z',
  key: 'M14 10a4 4 0 1 0-4 4c.5 0 1-.1 1.4-.3L13 15h2v2h2v2h3v-3l-4.6-4.6c.2-.4.3-.9.3-1.4z',
  headset: 'M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-6H4zM20 13v4a2 2 0 0 1-2 2h-1v-6h3zM17 19a4 4 0 0 1-4 3',
  bank: 'M3 9l9-6 9 6M4 9v10M20 9v10M2 19h20M8 12v4M12 12v4M16 12v4',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  cart: 'M3 4h2l2.4 12.2A2 2 0 0 0 9.4 18h7.9a2 2 0 0 0 2-1.6L21 8H6M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  wrench: 'M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18l3 3 5.7-5.7a4.5 4.5 0 0 0 6-6L14 13l-3-3 3.7-3.7z',
  spark: 'M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  stop: 'M6 6h12v12H6z',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  close: 'M18 6L6 18M6 6l12 12',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
  chat: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z',
  chart: 'M3 3v18h18M8 17V9M13 17V5M18 17v-7',
  bolt: 'M13 2L3 14h7l-1 8 11-14h-7l1-6z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  check: 'M20 6L9 17l-5-5',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
};

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="stroke()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path()" />
    </svg>
  `,
})
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input('16');
  readonly stroke = input('1.8');
  protected readonly path = computed(() => ICON_PATHS[this.name()] ?? ICON_PATHS['spark']);
}
