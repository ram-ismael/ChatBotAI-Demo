import { Injectable, effect, signal } from '@angular/core';
import { UiPreferences } from '../models';

@Injectable({ providedIn: 'root' })
export class UiPreferencesService {
  readonly prefs = signal<UiPreferences>(this.restore());
  constructor() {
    effect(() => {
      try { window.localStorage.setItem('chatbotai-preferences-v1', JSON.stringify(this.prefs())); } catch { /* Storage may be unavailable. */ }
    });
  }
  toggle<K extends keyof UiPreferences>(key: K): void {
    this.prefs.update(p => ({ ...p, [key]: !p[key] }));
  }
  private restore(): UiPreferences {
    try {
      const p = JSON.parse(window.localStorage.getItem('chatbotai-preferences-v1') || '{}');
      return { reduceMotion: p?.reduceMotion === true, compact: p?.compact === true };
    } catch { return { reduceMotion: false, compact: false }; }
  }
}
