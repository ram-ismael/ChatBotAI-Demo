import { Component, ElementRef, PLATFORM_ID, computed, effect, inject, viewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatService } from '../core/services/chat.service';
import { ChatMessageComponent } from './chat-message.component';
import { TypingIndicatorComponent } from './typing-indicator.component';
import { MessageComposerComponent } from './message-composer.component';
import { PromptPanelComponent } from './prompt-panel.component';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-chat-window',
  imports: [
    ChatMessageComponent,
    TypingIndicatorComponent,
    MessageComposerComponent,
    PromptPanelComponent,
    IconComponent,
  ],
  template: `
    <div class="h-full flex flex-col min-h-0">
      <div class="shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b hairline">
        <div
          class="w-8 h-8 rounded-lg flex items-center justify-center text-ink-950 shrink-0"
          [style.background-color]="accent()"
        >
          <app-icon [name]="icon()" size="15" />
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">{{ business().label }} Assistant</p>
          <p class="text-[11px] text-faint truncate">{{ business().tagline }}</p>
        </div>
        <div class="ml-auto flex items-center gap-2 shrink-0">
          <span class="status-badge" [attr.data-status]="selected()?.status ?? 'active'">
            {{ selected()?.status ?? 'active' }}
          </span>
        </div>
      </div>

      <div #scrollArea class="flex-1 overflow-y-auto scroll-slim min-h-0">
        @if (showPromptPanel()) {
          <app-prompt-panel />
        }
        <div class="px-3 sm:px-6 py-4 space-y-4 max-w-3xl mx-auto">
          @for (message of selected()?.messages; track message.id) {
            <app-chat-message [message]="message" />
          }
          @if (chat.thinking()) {
            <app-typing-indicator />
          }
        </div>
      </div>

      @if (chat.error()) {
        <div class="shrink-0 px-3 sm:px-6 max-w-3xl mx-auto w-full pb-1">
          <div class="flex items-center gap-2 text-xs text-red-300 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            <app-icon name="alert" size="13" class="shrink-0" />
            <span class="flex-1">{{ chat.error() }}</span>
            <button type="button" class="underline shrink-0" (click)="chat.retryLast()">Retry</button>
            <button type="button" class="shrink-0" (click)="chat.dismissError()">
              <app-icon name="close" size="13" />
            </button>
          </div>
        </div>
      }

      <app-message-composer />
    </div>
  `,
})
export class ChatWindowComponent {
  protected readonly chat = inject(ChatService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly scrollArea = viewChild<ElementRef<HTMLElement>>('scrollArea');

  protected readonly business = computed(() => this.chat.business());
  protected readonly accent = computed(() => this.business().accent);
  protected readonly icon = computed(() => this.business().icon);
  protected readonly selected = computed(() => this.chat.selected());
  protected readonly showPromptPanel = computed(() => (this.selected()?.messages.length ?? 0) <= 1);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    effect(() => {
      const count = this.selected()?.messages.length ?? 0;
      const thinking = this.chat.thinking();
      const generating = this.chat.generating();
      void count;
      void thinking;
      void generating;
      queueMicrotask(() => {
        const el = this.scrollArea()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }
}
