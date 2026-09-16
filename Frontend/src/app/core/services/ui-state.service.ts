import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiStateService {
  readonly conversationsOpen = signal(false);
  readonly insightsOpen = signal(false);

  openConversations(): void {
    this.conversationsOpen.set(true);
    this.insightsOpen.set(false);
  }

  openInsights(): void {
    this.insightsOpen.set(true);
    this.conversationsOpen.set(false);
  }

  closeAll(): void {
    this.conversationsOpen.set(false);
    this.insightsOpen.set(false);
  }
}
