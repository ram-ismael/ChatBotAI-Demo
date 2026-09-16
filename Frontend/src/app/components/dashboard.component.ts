import { Component, computed, inject } from '@angular/core';
import { MetricsService } from '../core/services/metrics.service';
import { ChatService } from '../core/services/chat.service';
import { MetricCardComponent } from './metric-card.component';
import { IconComponent } from '../shared/icons';
import { TimeAgoPipe } from '../shared/pipes';

@Component({
  selector: 'app-dashboard',
  imports: [MetricCardComponent, IconComponent, TimeAgoPipe],
  template: `
    <div class="h-full flex flex-col min-h-0">
      <div class="px-4 pt-4 pb-3 shrink-0 flex items-center justify-between gap-2">
        <div>
          <h2 class="font-display text-sm font-semibold tracking-tightest flex items-center gap-2">
            <app-icon name="chart" size="15" class="text-accent-300" />
            Live Insights
          </h2>
          <p class="text-xs text-faint mt-0.5">{{ business().label }} · updated in real time</p>
        </div>
        <span class="flex items-center gap-1.5 text-[11px] text-teal-300 shrink-0">
          <span class="live-dot live-dot-online dot-pulse"></span> Live
        </span>
      </div>

      <div class="flex-1 overflow-y-auto scroll-slim px-4 pb-4 space-y-4">
        @if (metrics.loading()) {
          <div class="grid grid-cols-2 gap-2.5">
            @for (s of [1, 2, 3, 4]; track s) {
              <div class="skeleton h-32 rounded-xl"></div>
            }
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-2.5">
            @for (m of metrics.metrics(); track m.key) {
              <app-metric-card [metric]="m" />
            }
          </div>
        }

        <div class="surface rounded-xl p-3.5">
          <p class="label-caps mb-2">Most common questions</p>
          <div class="space-y-1.5">
            @for (q of metrics.topQuestions(); track q.text; let i = $index) {
              <div class="flex items-center gap-2.5 text-xs">
                <span class="text-faint w-3 shrink-0">{{ i + 1 }}</span>
                <span class="flex-1 text-mist truncate">{{ q.text }}</span>
                <span class="text-faint shrink-0">{{ q.count }}×</span>
              </div>
            }
          </div>
        </div>

        <div class="surface rounded-xl p-3.5">
          <p class="label-caps mb-2">Recent activity</p>
          <div class="space-y-2.5">
            @for (a of chat.activity(); track a.id) {
              <div class="flex items-start gap-2 text-xs">
                <app-icon
                  [name]="a.kind === 'lead' ? 'bolt' : a.kind === 'status' ? 'check' : 'chat'"
                  size="13"
                  class="mt-0.5 shrink-0"
                  [class.text-accent-300]="a.kind !== 'status'"
                  [class.text-teal-300]="a.kind === 'status'"
                />
                <span class="flex-1 text-mist leading-snug">{{ a.text }}</span>
                <span class="text-faint shrink-0">{{ a.time | timeAgo }}</span>
              </div>
            } @empty {
              <p class="text-xs text-faint">Waiting for live events…</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  protected readonly metrics = inject(MetricsService);
  protected readonly chat = inject(ChatService);
  protected readonly business = computed(() => this.chat.business());
}
