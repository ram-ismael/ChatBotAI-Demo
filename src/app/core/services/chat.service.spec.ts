import { installTestStorage } from '../../testing/storage';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatService } from './chat.service';
import { MetricsService } from './metrics.service';

describe('static chat lifecycle', () => {
  let chat: ChatService;
  beforeEach(() => {
    vi.useFakeTimers();
    installTestStorage();
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    chat = TestBed.inject(ChatService);
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllTimers();
    vi.useRealTimers();
    window.localStorage.clear();
  });

  it('filters conversations by selected sector and keeps metrics in sync', () => {
    chat.selectBusiness('restaurant');
    expect(chat.filteredConversations().every(c => c.businessId === 'restaurant')).toBe(true);
    const sales = chat.conversations().find(c => c.businessId === 'sales')!;
    chat.selectConversation(sales.id);
    expect(chat.businessId()).toBe('sales');
    expect(TestBed.inject(MetricsService).businessId()).toBe('sales');
  });

  it('rejects a second send during thinking and completes one response', () => {
    const count = chat.selected()!.messages.length;
    expect(chat.sendMessage('Draft a follow-up email')).toBe(true);
    expect(chat.sendMessage('Duplicate')).toBe(false);
    vi.advanceTimersByTime(15000);
    expect(chat.selected()!.messages).toHaveLength(count + 2);
    expect(chat.selected()!.messages.at(-1)!.text).toContain('Sample draft (not sent)');
    expect(chat.busy()).toBe(false);
  });

  it('cancels a pending response when changing conversation', () => {
    const first = chat.selectedId();
    chat.sendMessage('Hello');
    const count = chat.selected()!.messages.length;
    chat.newConversation();
    vi.advanceTimersByTime(15000);
    expect(chat.conversations().find(c => c.id === first)!.messages).toHaveLength(count);
    expect(chat.selected()!.messages).toHaveLength(1);
    expect(chat.busy()).toBe(false);
  });

  it('stops streaming without resuming later', () => {
    chat.sendMessage('Review my pipeline');
    vi.advanceTimersByTime(1400);
    chat.stopStreaming();
    const text = chat.selected()!.messages.at(-1)!.text;
    vi.advanceTimersByTime(15000);
    expect(chat.selected()!.messages.at(-1)!.text).toBe(text);
    expect(chat.selected()!.messages.some(m => m.streaming)).toBe(false);
  });

  it('persists completed conversations and restores them after reload', () => {
    chat.sendMessage('My locally saved message');
    vi.advanceTimersByTime(15000);
    TestBed.tick();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ChatService);
    expect(restored.conversations().some(c => c.messages.some(m => m.text === 'My locally saved message'))).toBe(true);
  });

  it('recovers from malformed saved data', () => {
    TestBed.resetTestingModule();
    window.localStorage.setItem('chatbotai-conversations-v1', '[{"messages":null}]');
    TestBed.configureTestingModule({});
    const restored = TestBed.inject(ChatService);
    expect(restored.selected()).toBeTruthy();
    expect(restored.conversations().length).toBe(13);
  });

  it('resolves, reopens and deletes the selected conversation', () => {
    chat.toggleResolved();
    expect(chat.selected()!.status).toBe('resolved');
    chat.toggleResolved();
    expect(chat.selected()!.status).toBe('active');
    const id = chat.selectedId();
    chat.deleteSelected();
    expect(chat.conversations().some(c => c.id === id)).toBe(false);
    expect(chat.selected()).toBeTruthy();
  });

  it('does not inject unsolicited messages while idle', () => {
    const initial = JSON.stringify(chat.conversations());
    vi.advanceTimersByTime(60000);
    expect(JSON.stringify(chat.conversations())).toBe(initial);
  });
});
