import { Pipe, PipeTransform } from '@angular/core';
import { MetricFormat } from '../core/models';

@Pipe({ name: 'formatMetric', standalone: true })
export class FormatMetricPipe implements PipeTransform {
  transform(value: number, format: MetricFormat, precision?: number): string {
    switch (format) {
      case 'percent':
        return `${value.toFixed(precision ?? 1)}%`;
      case 'seconds':
        return `${value.toFixed(precision ?? 1)}s`;
      case 'currency':
        return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      case 'rating':
        return `${value.toFixed(precision ?? 1)} / 5`;
      default:
        return value.toLocaleString('en-US', { maximumFractionDigits: precision ?? 0 });
    }
  }
}

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(timestamp: number): string {
    const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
