import { Component, computed, inject, input } from '@angular/core';
import { LiveMetric } from '../core/models';
import { ChatService } from '../core/services/chat.service';
import { FormatMetricPipe } from '../shared/pipes';

const LOWER_IS_BETTER = new Set([
  'response', 'unanswered', 'open', 'escalations', 'handoffs', 'queue',
  'no-shows', 'avg-days', 'returns', 'emergency', 'triage', 'reminders',
]);

@Component({
  selector: 'app-metric-card',
  imports: [FormatMetricPipe],
  template: `
    <div class="surface rounded-xl p-3.5 space-y-2.5">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs text-faint truncate">{{ metric().label }}</p>
          <p class="font-display text-xl font-semibold tracking-tightest mt-0.5">
            {{ metric().value | formatMetric: metric().format: metric().precision }}
          </p>
        </div>
        @if (trend() !== 'flat') {
          <span
            class="text-[11px] font-semibold rounded-full px-1.5 py-0.5 shrink-0"
            [class.bg-teal-400\/10]="trend() === 'good'"
            [class.text-teal-300]="trend() === 'good'"
            [class.bg-rose-400\/10]="trend() === 'bad'"
            [class.text-rose-300]="trend() === 'bad'"
          >
            {{ delta() > 0 ? '+' : '' }}{{ delta() | formatMetric: metric().format: metric().precision }}
          </span>
        }
      </div>
      <svg viewBox="0 0 100 32" class="w-full h-8" preserveAspectRatio="none" aria-hidden="true">
        <polygon [attr.points]="areaPoints()" [style.fill]="accent()" class="spark-area" />
        <polyline [attr.points]="linePoints()" [style.stroke]="accent()" class="spark-line" vector-effect="non-scaling-stroke" />
      </svg>
      <p class="text-[11px] text-faint leading-snug">{{ metric().description }}</p>
    </div>
  `,
})
export class MetricCardComponent {
  private readonly chat = inject(ChatService);
  readonly metric = input.required<LiveMetric>();

  protected readonly accent = computed(() => this.chat.business().accent);

  protected readonly delta = computed(() => {
    const h = this.metric().history;
    return h.length > 1 ? this.metric().value - h[h.length - 2] : 0;
  });

  protected readonly trend = computed<'good' | 'bad' | 'flat'>(() => {
    const d = this.delta();
    if (Math.abs(d) < 0.0001) return 'flat';
    const upIsGood = !LOWER_IS_BETTER.has(this.metric().key);
    return d > 0 === upIsGood ? 'good' : 'bad';
  });

  protected readonly linePoints = computed(() => this.points().map((p) => `${p.x},${p.y}`).join(' '));
  protected readonly areaPoints = computed(() => {
    const pts = this.points();
    return `0,32 ${pts.map((p) => `${p.x},${p.y}`).join(' ')} 100,32`;
  });

  private points(): Array<{ x: number; y: number }> {
    const h = this.metric().history;
    if (!h.length) return [];
    const min = Math.min(...h);
    const max = Math.max(...h);
    const span = max - min || 1;
    return h.map((v, i) => ({
      x: (i / Math.max(1, h.length - 1)) * 100,
      y: 28 - ((v - min) / span) * 24,
    }));
  }
}
