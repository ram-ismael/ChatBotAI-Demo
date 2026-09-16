import { Injectable, OnDestroy, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConnectionState } from '../models';

@Injectable({ providedIn: 'root' })
export class ConnectionService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly state = signal<ConnectionState>('online');

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    if (!this.isBrowser) return;
    window.addEventListener('online', () => this.scheduleReconnect());
    window.addEventListener('offline', () => this.goOffline());
    this.state.set(navigator.onLine ? 'online' : 'offline');
  }

  get isOnline(): boolean {
    return this.state() === 'online';
  }

  simulateOutage(): void {
    this.goOffline();
  }

  reconnectNow(): void {
    if (this.state() === 'online') return;
    this.clearTimers();
    this.state.set('reconnecting');
    this.timers.push(setTimeout(() => this.state.set('online'), 1400));
  }

  private goOffline(): void {
    this.clearTimers();
    this.state.set('offline');
  }

  private scheduleReconnect(): void {
    if (this.state() === 'online') return;
    this.clearTimers();
    this.state.set('reconnecting');
    this.timers.push(setTimeout(() => this.state.set('online'), 1800 + Math.random() * 1800));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }
}
