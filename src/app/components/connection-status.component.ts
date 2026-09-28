import { Component, computed, inject } from '@angular/core';
import { ConnectionService } from '../core/services/connection.service';
import { IconComponent } from '../shared/icons';

@Component({
  selector: 'app-connection-status',
  imports: [IconComponent],
  template: `
    <div class="flex items-center gap-2">
      <span class="live-dot" [class]="dotClass()" [class.dot-pulse]="state() !== 'online'"></span>
      <span class="text-xs font-medium text-mist capitalize hidden sm:inline">{{ state() }}</span>
      @if (state() !== 'online') {
        <button type="button" class="btn-ghost !py-1 !px-2 !text-xs" (click)="reconnect()">
          <app-icon name="refresh" size="13" />
          Reconnect
        </button>
      }
    </div>
  `,
})
export class ConnectionStatusComponent {
  private readonly connection = inject(ConnectionService);

  protected readonly state = this.connection.state;
  protected readonly dotClass = computed(() => {
    switch (this.state()) {
      case 'offline':
        return 'live-dot-offline';
      case 'reconnecting':
        return 'live-dot-reconnecting';
      default:
        return 'live-dot-online';
    }
  });

  protected reconnect(): void {
    this.connection.reconnectNow();
  }
}
