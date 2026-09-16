import { Injectable, OnDestroy, inject, PLATFORM_ID, computed, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivityEvent, BusinessTypeId, ChatMessage, Conversation, ConversationStatus } from '../models';
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

  readonly businessId = signal<BusinessTypeId>('sales');
  readonly selectedId = signal<string | null>(null);
  readonly searchQuery = signal('');
  readonly generating = signal(false);
  readonly thinking = signal(false);
  readonly error = signal<string | null>(null);
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
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.customer.toLowerCase().includes(q) ||
          c.messages.some((m) => m.text.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  });

  readonly counts = computed(() => {
    const list = this.conversations();
    return {
      total: list.length,
      active: list.filter((c) => c.status === 'active').length,
      waiting: list.filter((c) => c.status === 'waiting').length,
      resolved: list.filter((c) => c.status === 'resolved').length,
      unread: list.filter((c) => c.unread).length,
    };
  });

  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private hintRotation = 0;

  constructor() {
    this.conversationsSignal.set(this.seedConversations());
    this.selectBusiness('sales');
    if (this.isBrowser) {
      this.simTimer = setInterval(() => this.simulateLiveEvent(), 6500);
    }
  }

  selectBusiness(id: BusinessTypeId): void {
    this.businessId.set(id);
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
    this.stopStreaming();
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
          text: business.greeting,
          time: Date.now(),
        },
      ],
    };
    this.conversationsSignal.update((list) => [conversation, ...list]);
    this.selectedId.set(conversation.id);
    this.error.set(null);
    this.pushActivity(business.id, `New ${business.shortLabel.toLowerCase()} conversation started`, 'message');
  }

  sendMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.generating()) return;

    let conversationId = this.selectedId();
    if (!conversationId) {
      this.newConversation();
      conversationId = this.selectedId();
    }
    if (!conversationId) return;

    const userMessage: ChatMessage = { id: uid('m'), role: 'user', text: trimmed, time: Date.now() };
    this.appendMessage(conversationId, userMessage);
    this.setStatus(conversationId, 'active');
    this.thinking.set(true);

    const business = this.business();
    const reply = this.generateReply(business.id, trimmed);

    const thinkingDelay = this.isBrowser ? 600 + Math.random() * 600 : 0;
    setTimeout(() => {
      this.thinking.set(false);
      this.beginStreaming(conversationId, reply);
    }, thinkingDelay);
  }

  stopStreaming(): void {
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
    const selected = this.selected();
    const last = selected?.messages[selected.messages.length - 1];
    if (!selected || !last) return;
    this.conversationsSignal.update((list) =>
      list.map((c) =>
        c.id === selected.id ? { ...c, messages: c.messages.filter((m) => !m.error) } : c,
      ),
    );
    this.error.set(null);
    this.sendMessage(last.text);
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
    this.pushActivity(this.businessId(), 'AI response is streaming', 'system');

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
    const fail = this.isBrowser && Math.random() < 0.045;
    if (fail) {
      this.patchMessage(conversationId, messageId, { text: '', streaming: false, error: true });
      this.error.set('The AI response could not be generated. Check your connection and retry.');
    } else {
      this.patchMessage(conversationId, messageId, { text: fullText, streaming: false });
      this.pushActivity(this.businessId(), 'AI response completed', 'system');
    }
    this.generating.set(false);
  }

  private generateReply(businessId: BusinessTypeId, userText: string): string {
    const business = getBusiness(businessId);
    const hints = business.replyHints;
    const hint = hints[this.hintRotation++ % hints.length];
    const acknowledged = userText.length > 90 ? 'I have noted all the details. ' : '';
    return `${acknowledged}${hint}`;
  }

  private appendMessage(conversationId: string, message: ChatMessage): void {
    this.conversationsSignal.update((list) =>
      list.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
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

  private simulateLiveEvent(): void {
    if (this.generating() && Math.random() < 0.7) return;
    const roll = Math.random();
    const list = this.conversations();
    if (list.length === 0) return;

    if (roll < 0.52) {
      const target = list[Math.floor(Math.random() * list.length)];
      const business = getBusiness(target.businessId);
      const incoming = INCOMING_POOL[Math.floor(Math.random() * INCOMING_POOL.length)];
      const reply = business.replyHints[Math.floor(Math.random() * business.replyHints.length)];
      this.appendMessage(target.id, { id: uid('m'), role: 'user', text: incoming, time: Date.now() });
      this.setStatus(target.id, 'active');
      setTimeout(() => {
        this.appendMessage(target.id, { id: uid('m'), role: 'assistant', text: reply, time: Date.now() });
      }, 900 + Math.random() * 1200);
      if (target.id !== this.selectedId()) {
        this.conversationsSignal.update((cs) =>
          cs.map((c) => (c.id === target.id ? { ...c, unread: true } : c)),
        );
      }
      this.pushActivity(target.businessId, `${target.customer} replied in "${target.title}"`, 'message');
    } else if (roll < 0.68) {
      const active = list.filter((c) => c.status !== 'resolved');
      const target = active[Math.floor(Math.random() * active.length)];
      if (!target) return;
      this.setStatus(target.id, 'resolved');
      this.pushActivity(target.businessId, `"${target.title}" was marked resolved`, 'status');
    } else if (roll < 0.85) {
      const business = BUSINESS_TYPES[Math.floor(Math.random() * BUSINESS_TYPES.length)];
      const topic = business.demoTopics[Math.floor(Math.random() * business.demoTopics.length)];
      const customer = business.demoCustomers[Math.floor(Math.random() * business.demoCustomers.length)];
      const conversation: Conversation = {
        id: uid('c'),
        businessId: business.id,
        title: topic,
        customer,
        status: Math.random() < 0.5 ? 'waiting' : 'active',
        unread: true,
        updatedAt: Date.now(),
        messages: [
          {
            id: uid('m'),
            role: 'user',
            text: `Hi, I have a question about ${topic.toLowerCase()}.`,
            time: Date.now(),
          },
        ],
      };
      this.conversationsSignal.update((cs) => [conversation, ...cs]);
      this.pushActivity(business.id, `New conversation: "${topic}"`, 'lead');
    } else {
      const waiting = list.filter((c) => c.status === 'active');
      const target = waiting[Math.floor(Math.random() * waiting.length)];
      if (!target) return;
      this.setStatus(target.id, 'waiting');
      this.pushActivity(target.businessId, `"${target.title}" is waiting for a reply`, 'status');
    }
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
            ? business.replyHints[r % business.replyHints.length]
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
    if (this.simTimer) clearInterval(this.simTimer);
  }
}
