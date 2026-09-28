import { Injectable, OnDestroy, inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BusinessTypeId, LiveMetric, MetricDefinition } from '../models';
import { getBusiness } from '../data/business-catalog';

const HISTORY_LENGTH = 24;

@Injectable({ providedIn: 'root' })
export class MetricsService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly businessId = signal<BusinessTypeId>('sales');
  readonly metrics = signal<LiveMetric[]>([]);
  readonly loading = signal(false);
  private readonly tickCount = signal(0);

  readonly topQuestions = computed(() => {
    const business = getBusiness(this.businessId());
    return business.suggestedPrompts.slice(0, 4).map((text, i) => ({
      text,
      count: Math.max(6, 64 - i * 13 - (this.tickCount() % 3)),
    }));
  });

  private ticker: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.setBusiness('sales');
    if (this.isBrowser) {
      this.ticker = setInterval(() => this.tick(), 3600);
    }
  }

  setBusiness(id: BusinessTypeId): void {
    this.businessId.set(id);
    this.loading.set(true);
    this.metrics.set(getBusiness(id).metrics.map((def) => this.instantiate(def, id)));
    this.tickCount.set(0);
    setTimeout(() => this.loading.set(false), this.isBrowser ? 350 : 0);
  }

  private seedRandom(id: string): () => number {
    let h = 2166136261;
    for (const ch of id) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return () => {
      h = Math.imul(h ^ (h >>> 15), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }

  private instantiate(def: MetricDefinition, id: BusinessTypeId): LiveMetric {
    const rnd = this.seedRandom(id + def.key);
    const span = def.max - def.min;
    const value = Math.min(def.max, Math.max(def.min, def.base + (rnd() - 0.5) * span * 0.08));
    const history: number[] = [];
    let v = value;
    for (let i = 0; i < HISTORY_LENGTH; i++) {
      v = Math.min(def.max, Math.max(def.min, v + (rnd() - 0.5) * span * def.drift * 1.4));
      history.push(v);
    }
    history[history.length - 1] = value;
    return { ...def, value, history };
  }

  private tick(): void {
    this.metrics.update((list) =>
      list.map((m) => {
        const span = m.max - m.min;
        const delta = (Math.random() - 0.48) * span * m.drift * 0.9;
        const value = Math.min(m.max, Math.max(m.min, m.value + delta));
        const history = [...m.history.slice(-(HISTORY_LENGTH - 1)), value];
        return { ...m, value, history };
      }),
    );
    this.tickCount.update((t) => t + 1);
  }

  ngOnDestroy(): void {
    if (this.ticker) clearInterval(this.ticker);
  }
}
