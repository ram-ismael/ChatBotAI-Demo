import { Component, computed, inject } from '@angular/core';
import { ChatService } from '../core/services/chat.service';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-prompt-panel',
  imports: [IconComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6 text-center space-y-5">
      <div
        class="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-ink-950"
        [style.background-color]="accent()"
      >
        <app-icon [name]="icon()" size="22" />
      </div>
      <div>
        <h2 class="font-display text-lg font-semibold tracking-tightest">{{ business().label }} Assistant</h2>
        <p class="text-sm text-mist mt-1.5 leading-relaxed max-w-lg mx-auto">{{ business().greeting }}</p>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        @for (action of business().quickActions; track action.id) {
          <button type="button" class="chip" (click)="chat.sendMessage(action.message)">
            <app-icon name="bolt" size="12" />
            {{ action.label }}
          </button>
        }
      </div>

      <div class="text-left surface-inset rounded-xl p-3 space-y-1">
        <p class="label-caps px-1 pb-1">Suggested prompts</p>
        @for (prompt of business().suggestedPrompts; track prompt) {
          <button
            type="button"
            class="w-full text-left text-sm text-mist hover:text-mist-100 hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
            (click)="chat.sendMessage(prompt)"
          >
            {{ prompt }}
          </button>
        }
      </div>
    </div>
  `,
})
export class PromptPanelComponent {
  protected readonly chat = inject(ChatService);
  protected readonly business = computed(() => this.chat.business());
  protected readonly accent = computed(() => this.business().accent);
  protected readonly icon = computed(() => this.business().icon);
}
