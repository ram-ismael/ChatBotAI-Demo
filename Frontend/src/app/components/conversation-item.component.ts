import { Component, input } from '@angular/core';
import { Conversation } from '../core/models';
import { getBusiness } from '../core/data/business-catalog';
import { TimeAgoPipe } from '../shared/pipes';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-conversation-item',
  imports: [TimeAgoPipe, IconComponent],
  template: `
    <div
      class="w-full text-left rounded-xl px-3 py-2.5 transition-colors duration-150 cursor-pointer border hover:bg-white/5"
      [style.border-color]="selected() ? 'color-mix(in srgb, ' + accent() + ' 45%, transparent)' : 'transparent'"
      [style.background-color]="selected() ? 'color-mix(in srgb, ' + accent() + ' 10%, transparent)' : ''"
    >
      <div class="flex items-center justify-between gap-2">
        <span class="text-sm font-medium truncate text-mist-100">{{ conversation().title }}</span>
        @if (conversation().unread) {
          <span class="live-dot live-dot-online shrink-0"></span>
        }
      </div>
      <div class="flex items-center justify-between gap-2 mt-1">
        <span class="text-xs text-faint truncate">
          {{ conversation().customer }} · {{ preview() }}
        </span>
        <span class="text-[11px] text-faint shrink-0">{{ conversation().updatedAt | timeAgo }}</span>
      </div>
      <div class="flex items-center gap-1.5 mt-1.5">
        <app-icon [name]="icon()" size="12" class="text-faint" />
        <span class="status-badge" [attr.data-status]="conversation().status">{{ conversation().status }}</span>
      </div>
    </div>
  `,
})
export class ConversationItemComponent {
  readonly conversation = input.required<Conversation>();
  readonly selected = input(false);

  protected readonly accent = () => getBusiness(this.conversation().businessId).accent;
  protected readonly icon = () => getBusiness(this.conversation().businessId).icon;

  protected preview(): string {
    const messages = this.conversation().messages;
    const last = messages[messages.length - 1];
    return last ? last.text.slice(0, 42) + (last.text.length > 42 ? '…' : '') : 'No messages yet';
  }
}
