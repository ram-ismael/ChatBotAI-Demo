import { Injectable, signal } from '@angular/core';
import { UiPreferences } from '../models';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  readonly prefs = signal<UiPreferences>({
    reduceMotion: false,
    compact: false,
    sound: false,
  });

  toggle<K extends keyof UiPreferences>(key: K): void {
    this.prefs.update((p) => ({ ...p, [key]: !p[key] }));
  }
}
