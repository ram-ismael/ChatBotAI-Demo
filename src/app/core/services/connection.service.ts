import { Injectable, OnDestroy, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConnectionState } from '../models';

@Injectable({ providedIn: 'root' })
export class ConnectionService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly state = signal<ConnectionState>('online');

  private readonly onlineHandler = () => this.scheduleReconnect();
  private readonly offlineHandler = () => this.goOffline();
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    if (!this.isBrowser) return;
    window.addEventListener('online', this.onlineHandler);
    window.addEventListener('offline', this.offlineHandler);
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
    this.timers.push(setTimeout(() => this.state.set(navigator.onLine ? 'online' : 'offline'), 1400));
  }

  private goOffline(): void {
    this.clearTimers();
    this.state.set('offline');
  }

  private scheduleReconnect(): void {
    if (this.state() === 'online') return;
    this.clearTimers();
    this.state.set('reconnecting');
    this.timers.push(setTimeout(() => this.state.set(navigator.onLine ? 'online' : 'offline'), 1800 + Math.random() * 1800));
  }

  private clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  ngOnDestroy(): void {
    this.clearTimers();
    if (this.isBrowser) {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
  }
}
