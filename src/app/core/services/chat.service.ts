import { Injectable, OnDestroy, inject, PLATFORM_ID, computed, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivityEvent, BusinessTypeId, ChatMessage, Conversation, ConversationStatus } from '../models';
import { demoReply } from '../data/demo-replies';
import { MetricsService } from './metrics.service';
import { BUSINESS_TYPES, getBusiness } from '../data/business-catalog';

let idCounter = 0;
const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${(++idCounter).toString(36)}`;

const INCOMING_POOL: string[] = [
  'Thanks — that helps a lot.',
  'Could you send me the details by email as well?',
  'Is there anything else I should know?',
  'Perfect, that is exactly what I needed.',
  'Can you confirm that for me one more time?',
];

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly metrics = inject(MetricsService);
  readonly storageWarning = signal<string | null>(null);
  readonly businessId = signal<BusinessTypeId>('sales');
  readonly selectedId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly generating = signal(false);
  readonly thinking = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = computed(() => this.generating() || this.thinking());
  readonly activity = signal<ActivityEvent[]>([]);

  private readonly conversationsSignal = signal<Conversation[]>([]);
  readonly conversations = this.conversationsSignal.asReadonly();

  readonly business = computed(() => getBusiness(this.businessId()));
  readonly selected = computed(
    () => this.conversations().find((c) => c.id === this.selectedId()) ?? null,
  );

  readonly filteredConversations = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return [...this.conversations()]
      .filter(
        (c) =>
          c.businessId === this.businessId() && (!q ||
          c.title.toLowerCase().includes(q) ||
          c.customer.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q))),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  });

  readonly counts = computed(() => {
    const list = this.conversations().filter(c => c.businessId === this.businessId());
    return {
      total: list.length,
      active: list.filter((c) => c.status === 'active').length,
      waiting: list.filter((c) => c.status === 'waiting').length,
      resolved: list.filter((c) => c.status === 'resolved').length,
      unread: list.filter((c) => c.unread).length,
    };
  });

  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private thinkingTimer: ReturnType<typeof setTimeout> | null = null;
  private requestId = 0;

  constructor() {
    this.conversationsSignal.set(this.restore() ?? this.seedConversations());
    this.selectBusiness('sales');
    effect(() => {
      const list = this.conversations();
      if (!this.isBrowser || this.busy()) return;
      try {
        window.localStorage.setItem('chatbotai-conversations-v1', JSON.stringify(list.slice(0, 80)));
        this.storageWarning.set(null);
      } catch {
        this.storageWarning.set('Storage is unavailable or full. Export your chat to keep a copy.');
      }
    });
  }

  private restore(): Conversation[] | null {
    if (!this.isBrowser) return null;
    try {
      const data = JSON.parse(window.localStorage.getItem('chatbotai-conversations-v1') || 'null');
      if (!Array.isArray(data) || data.length > 80) return null;
      const valid = data.every(c => c && typeof c.id === 'string' && typeof c.title === 'string'
        && typeof c.customer === 'string' && typeof c.unread === 'boolean'
        && Number.isFinite(c.updatedAt) && BUSINESS_TYPES.some(b => b.id === c.businessId)
        && ['active', 'waiting', 'resolved'].includes(c.status)
        && Array.isArray(c.messages) && c.messages.length <= 200
        && c.messages.every((m: ChatMessage) => m && typeof m.id === 'string' && ['user', 'assistant'].includes(m.role)
          && typeof m.text === 'string' && m.text.length <= 8000 && Number.isFinite(m.time)));
      if (!valid || new Set(data.map(c => c.id)).size !== data.length) return null;
      return data.map(c => ({ ...c, messages: c.messages.filter((m: ChatMessage) => !m.error).map((m: ChatMessage) => ({ ...m, streaming: false })) }));
    } catch { return null; }
  }

  selectBusiness(id: BusinessTypeId): void {
    this.stopStreaming();
    this.businessId.set(id);
    this.metrics.setBusiness(id);
    this.searchQuery.set('');
    const existing = [...this.conversations()]
      .filter((c) => c.businessId === id)
      .sort((a, b) => b.updatedAt - a.updatedAt)[0];
    if (existing) {
      this.selectConversation(existing.id);
    } else {
      this.newConversation();
    }
  }

  selectConversation(id: string): void {
    const target = this.conversations().find(c => c.id === id);
    if (!target) return;
    this.stopStreaming();
    if (this.businessId() !== target.businessId) {
      this.businessId.set(target.businessId);
      this.metrics.setBusiness(target.businessId);
    }
    this.selectedId.set(id);
    this.error.set(null);
    this.conversationsSignal.update((list) =>
      list.map((c) => (c.id === id ? { ...c, unread: false } : c)),
    );
  }

  newConversation(): void {
    this.stopStreaming();
    const business = this.business();
    const topic = business.demoTopics[Math.floor(Math.random() * business.demoTopics.length)];
    const customer = business.demoCustomers[Math.floor(Math.random() * business.demoCustomers.length)];
    const conversation: Conversation = {
      id: uid('c'),
      businessId: business.id,
      title: topic,
      customer,
      status: 'active',
      unread: false,
      updatedAt: Date.now(),
      messages: [
        {
          id: uid('m'),
          role: 'assistant',
          text: 'Demo assistant — no live business systems are connected.\n\n' + business.greeting,
          time: Date.now(),
        },
      ],
    };
    this.conversationsSignal.update((list) => [conversation, ...list].slice(0, 80));
    this.selectedId.set(conversation.id);
    this.error.set(null);
    this.pushActivity(business.id, `New ${business.shortLabel.toLowerCase()} conversation started`, 'message');
  }

  sendMessage(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 4000 || this.busy()) return false;

    let conversationId = this.selectedId();
    if (!conversationId) {
      this.newConversation();
      conversationId = this.selectedId();
    }
    if (!conversationId) return false;

    const userMessage: ChatMessage = { id: uid('m'), role: 'user', text: trimmed, time: Date.now() };
    this.appendMessage(conversationId, userMessage);
    this.setStatus(conversationId, 'active');
    this.thinking.set(true);

    const business = this.business();
    const reply = this.generateReply(business.id, trimmed);

    const token = ++this.requestId;
    const thinkingDelay = this.isBrowser ? 600 + Math.random() * 600 : 0;
    this.thinkingTimer = setTimeout(() => {
      if (token !== this.requestId) return;
      this.thinkingTimer = null;
      this.thinking.set(false);
      this.beginStreaming(conversationId, reply);
    }, thinkingDelay);
    return true;
  }

  stopStreaming(): void {
    this.requestId++;
    if (this.thinkingTimer) clearTimeout(this.thinkingTimer);
    this.thinkingTimer = null;
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.thinking.set(false);
    const id = this.selectedId();
    if (id) {
      this.conversationsSignal.update((list) =>
        list.map((c) =>
          c.id === id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.streaming ? { ...m, streaming: false } : m,
                ),
              }
            : c,
        ),
      );
    }
    this.generating.set(false);
  }

  retryLast(): void {
    if (this.busy()) return;
    const c = this.selected();
    const last = c?.messages.filter(m => m.role === 'user').at(-1);
    if (!c || !last) return;
    this.conversationsSignal.update(list => list.map(item => item.id === c.id
      ? { ...item, messages: item.messages.filter(m => !m.error) } : item));
    this.error.set(null);
    this.beginStreaming(c.id, this.generateReply(c.businessId, last.text));
  }

  toggleResolved(): void {
    const c = this.selected();
    if (!c) return;
    this.stopStreaming();
    this.setStatus(c.id, c.status === 'resolved' ? 'active' : 'resolved');
    this.pushActivity(c.businessId, 'Conversation ' + (c.status === 'resolved' ? 'reopened' : 'resolved'), 'status');
  }

  deleteSelected(): void {
    const id = this.selectedId();
    this.stopStreaming();
    this.conversationsSignal.update(list => list.filter(c => c.id !== id));
    this.selectedId.set(null);
    this.selectBusiness(this.businessId());
  }

  exportConversation(): void {
    const c = this.selected();
    if (!c || !this.isBrowser) return;
    const text = 'ChatBotAI — simulated conversation\n' + c.title + '\n\n'
      + c.messages.map(m => m.role.toUpperCase() + ': ' + m.text).join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chatbotai-' + c.businessId + '-chat.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  dismissError(): void {
    this.error.set(null);
  }

  private beginStreaming(conversationId: string, fullText: string): void {
    this.generating.set(true);
    const assistantMessage: ChatMessage = {
      id: uid('m'),
      role: 'assistant',
      text: '',
      time: Date.now(),
      streaming: true,
    };
    this.appendMessage(conversationId, assistantMessage);
    this.pushActivity(this.businessId(), 'Simulated response is streaming', 'system');

    if (!this.isBrowser) {
      this.finishStreaming(conversationId, assistantMessage.id, fullText);
      return;
    }

    const words = fullText.split(' ');
    let index = 0;
    this.streamTimer = setInterval(() => {
      index += 1 + Math.floor(Math.random() * 2);
      const partial = words.slice(0, index).join(' ');
      const done = index >= words.length;
      this.patchMessage(conversationId, assistantMessage.id, {
        text: done ? fullText : partial,
        streaming: !done,
      });
      if (done) {
        this.finishStreaming(conversationId, assistantMessage.id, fullText);
      }
    }, 45 + Math.random() * 40);
  }

  private finishStreaming(conversationId: string, messageId: string, fullText: string): void {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.patchMessage(conversationId, messageId, { text: fullText, streaming: false });
    this.pushActivity(this.businessId(), 'Simulated response completed', 'system');
    this.generating.set(false);
  }

  private generateReply(businessId: BusinessTypeId, userText: string): string {
    return demoReply(businessId, userText);
  }

  private appendMessage(conversationId: string, message: ChatMessage): void {
    this.conversationsSignal.update((list) =>
      list.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message].slice(-200), updatedAt: Date.now() }
          : c,
      ),
    );
  }

  private patchMessage(
    conversationId: string,
    messageId: string,
    patch: Partial<ChatMessage>,
  ): void {
    this.conversationsSignal.update((list) =>
      list.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: c.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
            }
          : c,
      ),
    );
  }

  private setStatus(conversationId: string, status: ConversationStatus): void {
    this.conversationsSignal.update((list) =>
      list.map((c) => (c.id === conversationId ? { ...c, status } : c)),
    );
  }

  private pushActivity(businessId: BusinessTypeId, text: string, kind: ActivityEvent['kind']): void {
    this.activity.update((list) =>
      [{ id: uid('a'), businessId, text, time: Date.now(), kind }, ...list].slice(0, 8),
    );
  }

  private seedConversations(): Conversation[] {
    const seeds: Array<{ business: BusinessTypeId; topic: number; customer: number; replies: number; status: ConversationStatus; unread: boolean }> = [
      { business: 'sales', topic: 0, customer: 0, replies: 2, status: 'active', unread: true },
      { business: 'support', topic: 0, customer: 1, replies: 3, status: 'active', unread: true },
      { business: 'restaurant', topic: 0, customer: 2, replies: 2, status: 'waiting', unread: false },
      { business: 'pharmacy', topic: 0, customer: 3, replies: 2, status: 'active', unread: false },
      { business: 'ecommerce', topic: 0, customer: 4, replies: 3, status: 'resolved', unread: false },
      { business: 'clinic', topic: 1, customer: 0, replies: 2, status: 'waiting', unread: true },
      { business: 'real-estate', topic: 1, customer: 1, replies: 2, status: 'resolved', unread: false },
      { business: 'finance', topic: 0, customer: 2, replies: 2, status: 'active', unread: false },
      { business: 'hr', topic: 0, customer: 3, replies: 1, status: 'resolved', unread: false },
      { business: 'education', topic: 1, customer: 4, replies: 2, status: 'active', unread: false },
      { business: 'services', topic: 0, customer: 0, replies: 2, status: 'waiting', unread: false },
      { business: 'retail', topic: 0, customer: 1, replies: 2, status: 'resolved', unread: false },
      { business: 'general', topic: 0, customer: 2, replies: 1, status: 'active', unread: false },
    ];

    const now = Date.now();
    return seeds.map((s, i) => {
      const business = getBusiness(s.business);
      const messages: ChatMessage[] = [
        {
          id: uid('m'),
          role: 'user',
          text: `Hi, I need some help with ${business.demoTopics[s.topic].toLowerCase()}.`,
          time: now - (seeds.length - i) * 11 * 60_000,
        },
      ];
      for (let r = 0; r < s.replies; r++) {
        const isAssistant = r % 2 === 0;
        messages.push({
          id: uid('m'),
          role: isAssistant ? 'assistant' : 'user',
          text: isAssistant
            ? demoReply(business.id, business.demoTopics[s.topic])
            : INCOMING_POOL[(i + r) % INCOMING_POOL.length],
          time: now - (seeds.length - i) * 11 * 60_000 + (r + 1) * 3 * 60_000,
        });
      }
      return {
        id: uid('c'),
        businessId: s.business,
        title: business.demoTopics[s.topic],
        customer: business.demoCustomers[s.customer],
        status: s.status,
        unread: s.unread,
        updatedAt: now - i * 7 * 60_000,
        messages,
      };
    });
  }

  ngOnDestroy(): void {
    if (this.streamTimer) clearInterval(this.streamTimer);
    if (this.thinkingTimer) clearTimeout(this.thinkingTimer);
    this.requestId++;
  }
}
