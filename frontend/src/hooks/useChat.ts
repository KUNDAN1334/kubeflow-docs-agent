import { useState, useCallback, useRef } from 'react';
import { Message, Source, ToolType, StreamEvent } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeToolLabel, setActiveToolLabel] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    const assistantId = generateId();
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);
    setActiveToolLabel(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), session_id: generateId() }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let toolUsed: ToolType | undefined;
      let sources: Source[] = [];
      let content = '';
      let latencyMs: number | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;

          try {
            const event: StreamEvent = JSON.parse(dataStr);

            if (event.type === 'tool_start') {
              toolUsed = event.tool_used;
              setActiveToolLabel(event.tool_used ?? null);
            } else if (event.type === 'source') {
              sources = event.sources ?? [];
              toolUsed = event.tool_used ?? toolUsed;
            } else if (event.type === 'token' && event.content) {
              content += event.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content, toolUsed, sources }
                    : m
                )
              );
            } else if (event.type === 'done') {
              latencyMs = event.latency_ms;
              toolUsed = (event.tool_used as ToolType) ?? toolUsed;
            } else if (event.type === 'error') {
              content = event.content || 'An error occurred.';
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }

      // Finalize
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: content || 'No response generated.',
                status: 'done',
                toolUsed,
                sources,
                latencyMs,
              }
            : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const errorMsg =
        err instanceof Error
          ? `Connection error: ${err.message}`
          : 'Failed to connect to the backend. Make sure it is running.';

      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: errorMsg, status: 'error' }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setActiveToolLabel(null);
    }
  }, [isLoading]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setActiveToolLabel(null);
    setMessages(prev =>
      prev.map(m =>
        m.status === 'streaming' ? { ...m, status: 'done' } : m
      )
    );
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    activeToolLabel,
    sendMessage,
    stopGeneration,
    clearMessages,
  };
}
