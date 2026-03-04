export type SourceType = 'docs' | 'issues' | 'platform';
export type ToolType = 'search_docs' | 'search_issues' | 'search_platform';

export interface Source {
  title: string;
  url: string;
  score: number;
  source_type: SourceType;
  snippet?: string;
}

export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'streaming' | 'done' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status?: MessageStatus;
  toolUsed?: ToolType;
  sources?: Source[];
  latencyMs?: number;
  timestamp: Date;
}

export interface StreamEvent {
  type: 'tool_start' | 'source' | 'token' | 'done' | 'error';
  content?: string;
  tool_used?: ToolType;
  sources?: Source[];
  latency_ms?: number;
  sources_count?: number;
}
