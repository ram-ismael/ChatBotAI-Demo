export type BusinessTypeId =
  | 'sales'
  | 'pharmacy'
  | 'retail'
  | 'restaurant'
  | 'education'
  | 'clinic'
  | 'real-estate'
  | 'support'
  | 'finance'
  | 'hr'
  | 'ecommerce'
  | 'services'
  | 'general';

export type ConnectionState = 'online' | 'offline' | 'reconnecting';

export type MetricFormat = 'number' | 'percent' | 'seconds' | 'currency' | 'rating';

export interface QuickAction {
  id: string;
  label: string;
  message: string;
}

export interface MetricDefinition {
  key: string;
  label: string;
  format: MetricFormat;
  description: string;
  base: number;
  min: number;
  max: number;
  step: number;
  drift: number;
  precision?: number;
}

export interface BusinessType {
  id: BusinessTypeId;
  label: string;
  shortLabel: string;
  tagline: string;
  accent: string;
  icon: string;
  greeting: string;
  suggestedPrompts: string[];
  quickActions: QuickAction[];
  metrics: MetricDefinition[];
  demoTopics: string[];
  demoCustomers: string[];
  replyHints: string[];
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  time: number;
  streaming?: boolean;
  error?: boolean;
}

export type ConversationStatus = 'active' | 'waiting' | 'resolved';

export interface Conversation {
  id: string;
  businessId: BusinessTypeId;
  title: string;
  customer: string;
  status: ConversationStatus;
  unread: boolean;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface LiveMetric extends MetricDefinition {
  value: number;
  history: number[];
}

export interface ActivityEvent {
  id: string;
  businessId: BusinessTypeId;
  text: string;
  time: number;
  kind: 'message' | 'status' | 'lead' | 'system';
}

export interface UiPreferences {
  reduceMotion: boolean;
  compact: boolean;
  sound: boolean;
}
