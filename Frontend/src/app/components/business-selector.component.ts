import { Component, computed, inject } from '@angular/core';
import { ChatService } from '../core/services/chat.service';
import { MetricsService } from '../core/services/metrics.service';
import { BUSINESS_TYPES } from '../core/data/business-catalog';

@Component({
  selector: 'app-business-selector',
  imports: [],
  template: `
    <div class="flex items-center gap-2 overflow-x-auto scroll-slim py-1 -mx-1 px-1" role="tablist" aria-label="Business type">
      @for (b of businessTypes; track b.id) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="isActive(b.id)"
          class="chip"
          [class.chip-selected]="isActive(b.id)"
          [style.--chip-accent]="b.accent"
          (click)="select(b.id)"
        >
          <span class="live-dot" [style.background-color]="b.accent"></span>
          {{ b.shortLabel }}
        </button>
      }
    </div>
  `,
})
export class BusinessSelectorComponent {
  private readonly chat = inject(ChatService);
  private readonly metrics = inject(MetricsService);

  protected readonly businessTypes = BUSINESS_TYPES;
  protected readonly activeId = computed(() => this.chat.businessId());

  protected isActive(id: string): boolean {
    return this.activeId() === id;
  }

  protected select(id: (typeof BUSINESS_TYPES)[number]['id']): void {
    this.chat.selectBusiness(id);
    this.metrics.setBusiness(id);
  }
}
