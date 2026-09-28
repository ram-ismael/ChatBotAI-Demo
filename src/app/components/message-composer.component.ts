import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { ChatService } from '../core/services/chat.service';
import { ConnectionService } from '../core/services/connection.service';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-message-composer',
  imports: [IconComponent],
  template: `
    <div class="shrink-0 border-t hairline p-3 sm:p-4">
      @if (!connection.isOnline) {
        <div class="mb-2 text-xs flex items-center gap-2 text-amber-300 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2">
          <app-icon name="alert" size="13" />
          Offline demo — simulated replies still work locally. No messages are sent to a server.
        </div>
      }
      <div class="flex items-end gap-2 surface-inset rounded-xl px-3 py-2 focus-within:border-accent-500/50 transition-colors">
        <textarea
          #input
          rows="1"
          class="flex-1 bg-transparent resize-none focus:outline-none text-sm placeholder:text-faint max-h-36 scroll-slim py-1.5"
          placeholder="Message the {{ chat.business().label }} assistant…"
          [disabled]="chat.busy()"
          aria-label="Message the assistant" maxlength="4000"
          (keydown.enter)="onEnter($event)"
        ></textarea>
        @if (chat.busy()) {
          <button type="button" class="icon-btn !text-red-300" title="Stop generating" (click)="chat.stopStreaming()">
            <app-icon name="stop" size="14" />
          </button>
        } @else {
          <button
            type="button"
            class="icon-btn !text-accent-300"
            title="Send message"
            [disabled]="chat.busy()"
            (click)="send()"
          >
            <app-icon name="send" size="15" />
          </button>
        }
      </div>
      @if (chat.storageWarning()) { <p class="text-xs text-amber-300" role="status">{{ chat.storageWarning() }}</p> }
      <p class="text-[11px] text-faint mt-1.5 px-1">Enter to send · Shift + Enter for a new line · Simulated replies · saved on this device</p>
    </div>
  `,
})
export class MessageComposerComponent {
  protected readonly chat = inject(ChatService);
  protected readonly connection = inject(ConnectionService);
  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('input');

  protected onEnter(rawEvent: Event): void {
    const event = rawEvent as KeyboardEvent;
    if (event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  protected send(): void {
    const el = this.input()?.nativeElement;
    if (!el) return;
    if (this.chat.sendMessage(el.value)) el.value = '';
  }
}
