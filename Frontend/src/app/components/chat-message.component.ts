import { Component, computed, inject, input } from '@angular/core';
import { ChatMessage } from '../core/models';
import { ChatService } from '../core/services/chat.service';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-chat-message',
  imports: [IconComponent],
  template: `
    @if (message().role === 'user') {
      <div class="msg-enter flex justify-end">
        <div class="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-br-md bg-accent-500/90 text-white px-3.5 py-2.5 text-sm leading-relaxed">
          <p class="whitespace-pre-wrap">{{ message().text }}</p>
        </div>
      </div>
    } @else {
      <div class="msg-enter flex items-start gap-2.5">
        <div
          class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-ink-950"
          [style.background-color]="accent()"
        >
          <app-icon [name]="icon()" size="14" />
        </div>
        <div class="max-w-[85%] sm:max-w-[70%] min-w-0">
          @if (message().error) {
            <div class="surface-inset rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm flex items-center gap-2 text-red-300">
              <app-icon name="alert" size="15" />
              This response failed to generate.
            </div>
            <button type="button" class="btn-ghost !py-1 !px-2 !text-xs mt-1.5" (click)="chat.retryLast()">
              <app-icon name="refresh" size="12" /> Retry
            </button>
          } @else {
            <div class="surface-inset rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed text-mist-100">
              <p class="whitespace-pre-wrap" [class.streaming-caret]="message().streaming">{{ message().text }}</p>
              @if (message().streaming && !message().text) {
                <span class="inline-flex gap-1 py-1">
                  <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
                </span>
              }
            </div>
          }
        </div>
      </div>
    }
  `,
})
export class ChatMessageComponent {
  protected readonly chat = inject(ChatService);
  readonly message = input.required<ChatMessage>();

  protected readonly accent = computed(() => this.chat.business().accent);
  protected readonly icon = computed(() => this.chat.business().icon);
}
