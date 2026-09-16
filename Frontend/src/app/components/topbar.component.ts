import { Component, inject, signal } from '@angular/core';
import { ConnectionService } from '../core/services/connection.service';
import { UiPreferencesService } from '../core/services/ui-preferences.service';
import { UiStateService } from '../core/services/ui-state.service';
import { ConnectionStatusComponent } from './connection-status.component';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-topbar',
  imports: [ConnectionStatusComponent, IconComponent],
  template: `
    <header class="shrink-0 flex items-center gap-3 px-3 sm:px-4 h-14 border-b hairline surface relative z-30">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-white shrink-0">
          <app-icon name="spark" size="16" />
        </div>
        <div class="min-w-0">
          <h1 class="font-display text-sm font-semibold tracking-tightest leading-tight">ChatBotAI</h1>
          <p class="text-[11px] text-faint leading-tight">Real-time business assistant · demo</p>
        </div>
      </div>

      <div class="ml-auto flex items-center gap-2 sm:gap-3">
        <app-connection-status />
        <button
          type="button"
          class="icon-btn lg:hidden"
          title="Conversations"
          (click)="ui.openConversations()"
        >
          <app-icon name="chat" size="16" />
        </button>
        <button
          type="button"
          class="icon-btn xl:hidden"
          title="Insights"
          (click)="ui.openInsights()"
        >
          <app-icon name="chart" size="16" />
        </button>
        <button
          type="button"
          class="icon-btn"
          [class.!border-accent-500\/70]="settingsOpen()"
          title="Settings"
          (click)="settingsOpen.set(!settingsOpen())"
        >
          <app-icon name="settings" size="16" />
        </button>
      </div>

      @if (settingsOpen()) {
        <div
          class="absolute right-3 top-14 mt-1 w-64 surface rounded-xl p-3 shadow-2xl shadow-black/50 z-50 space-y-1"
        >
          <p class="label-caps px-1 pb-1">Preferences</p>
          @for (pref of prefList; track pref.key) {
            <button
              type="button"
              class="w-full flex items-center justify-between text-sm text-mist hover:text-mist-100 rounded-lg px-2 py-2 hover:bg-white/5"
              (click)="prefs.toggle(pref.key)"
            >
              <span>{{ pref.label }}</span>
              <span
                class="w-8 h-[18px] rounded-full relative transition-colors"
                [class.bg-accent-500]="prefs.prefs()[pref.key]"
                [class.bg-ink-600]="!prefs.prefs()[pref.key]"
              >
                <span
                  class="absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white transition-all"
                  [style.left]="prefs.prefs()[pref.key] ? '16px' : '2px'"
                ></span>
              </span>
            </button>
          }
          <div class="border-t hairline my-1"></div>
          <button
            type="button"
            class="w-full flex items-center gap-2 text-sm text-amber-300 rounded-lg px-2 py-2 hover:bg-white/5"
            (click)="connection.simulateOutage(); settingsOpen.set(false)"
          >
            <app-icon name="alert" size="14" />
            Simulate connection outage
          </button>
        </div>
      }
    </header>
  `,
})
export class TopbarComponent {
  protected readonly connection = inject(ConnectionService);
  protected readonly prefs = inject(UiPreferencesService);
  protected readonly ui = inject(UiStateService);
  protected readonly settingsOpen = signal(false);

  protected readonly prefList = [
    { key: 'reduceMotion' as const, label: 'Reduce motion' },
    { key: 'compact' as const, label: 'Compact density' },
    { key: 'sound' as const, label: 'Sound notifications' },
  ];
}
