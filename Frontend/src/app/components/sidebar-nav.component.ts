import { Component, computed, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../core/services/chat.service';
import { ConversationItemComponent } from './conversation-item.component';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-sidebar-nav',
  imports: [FormsModule, ConversationItemComponent, IconComponent],
  template: `
    <div class="h-full flex flex-col min-h-0">
      <div class="p-3 space-y-2 shrink-0">
        <button type="button" class="btn-primary w-full" (click)="chat.newConversation()">
          <app-icon name="plus" size="15" />
          New conversation
        </button>
        <div class="relative">
          <app-icon name="search" size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="search"
            class="w-full bg-ink-800 border hairline rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-faint focus:outline-none focus:border-accent-500/60"
            placeholder="Search conversations…"
            [ngModel]="chat.searchQuery()"
            (ngModelChange)="chat.searchQuery.set($event)"
          />
        </div>
        <div class="flex items-center gap-3 px-1 pt-1 label-caps">
          <span>Conversations</span>
          <span class="ml-auto flex items-center gap-2 normal-case tracking-normal font-medium text-xs">
            <span class="text-mist">{{ counts().active }} active</span>
            <span class="text-faint">{{ counts().resolved }} resolved</span>
            @if (counts().unread) {
              <span class="bg-accent-500/20 text-accent-300 rounded-full px-1.5 py-0.5 text-[10px]">{{ counts().unread }} new</span>
            }
          </span>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto scroll-slim px-2 pb-3 space-y-0.5">
        @for (c of chat.filteredConversations(); track c.id) {
          <app-conversation-item
            [conversation]="c"
            [selected]="c.id === chat.selectedId()"
            (click)="chat.selectConversation(c.id); close.emit()"
          />
        } @empty {
          <div class="text-center py-10 px-4">
            <app-icon name="search" size="22" class="text-faint mx-auto" />
            <p class="text-sm text-mist mt-2">No conversations match your search.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class SidebarNavComponent {
  protected readonly chat = inject(ChatService);
  readonly close = output<void>();
  protected readonly counts = computed(() => this.chat.counts());
}
