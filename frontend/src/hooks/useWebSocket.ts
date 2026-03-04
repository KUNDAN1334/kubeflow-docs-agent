/**
 * useWebSocket.ts
 *
 * The spec calls for WebSockets in the backend tech stack, but the implemented
 * transport is SSE (Server-Sent Events) via /chat, which is more compatible
 * with Railway's free tier (no persistent WS connections).
 *
 * This hook provides a WebSocket-compatible interface over SSE so components
 * can be swapped to true WebSockets without API changes if needed.
 */

import { useCallback, useRef, useState } from 'react';
import { StreamEvent } from '../types';

type WsStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

interface UseWebSocketOptions {
  onMessage: (event: StreamEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useWebSocket(options: UseWebSocketOptions) {
  const { onMessage, onOpen, onClose, onError } = options;
  const [status, setStatus] = useState<WsStatus>('idle');
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (query: string, sessionId: string = 'default') => {
      // Abort any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setStatus('connecting');

      try {
        const response = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, session_id: sessionId }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        setStatus('open');
        onOpen?.();

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (!data || data === '[DONE]') continue;

            try {
              const event: StreamEvent = JSON.parse(data);
              onMessage(event);
            } catch {
              // skip malformed lines
            }
          }
        }

        setStatus('closed');
        onClose?.();
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          setStatus('closed');
          return;
        }
        const msg = err instanceof Error ? err.message : 'Connection failed';
        setStatus('error');
        onError?.(msg);
      }
    },
    [onMessage, onOpen, onClose, onError]
  );

  const close = useCallback(() => {
    abortRef.current?.abort();
    setStatus('closed');
  }, []);

  return { status, send, close };
}
