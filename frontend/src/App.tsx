import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isLoading, activeToolLabel, sendMessage, stopGeneration, clearMessages } = useChat();

  const handleSend = useCallback(() => {
    const query = inputValue.trim();
    if (!query || isLoading) return;
    setInputValue('');
    sendMessage(query);
    if (inputRef.current) inputRef.current.style.height = '44px';
  }, [inputValue, isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const el = e.target;
    el.style.height = '44px';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, []);

  const handleSuggest = useCallback((q: string) => {
    setInputValue(q);
    inputRef.current?.focus();
  }, []);

  const canSend = !!inputValue.trim();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#FAFAFA',
      fontFamily: '"IBM Plex Sans", sans-serif',
    }}>
      <Header onClear={clearMessages} hasMessages={messages.length > 0} />

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        activeToolLabel={activeToolLabel}
        onSuggest={handleSuggest}
      />

      {/* ── Input Area ── */}
      <div style={{
        borderTop: '1px solid #E0E0E0',
        backgroundColor: '#FFFFFF',
        padding: '12px 16px 14px',
        flexShrink: 0,
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Tool status */}
          {isLoading && activeToolLabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px' }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#1976D2', display: 'inline-block',
                animation: 'pulse 1s ease-in-out infinite',
              }} />
              <span style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '10px', color: '#1976D2', letterSpacing: '0.04em',
              }}>
                {activeToolLabel === 'search_docs' && 'Searching documentation...'}
                {activeToolLabel === 'search_issues' && 'Checking known issues...'}
                {activeToolLabel === 'search_platform' && 'Looking up architecture...'}
                {!['search_docs', 'search_issues', 'search_platform'].includes(activeToolLabel) && 'Processing...'}
              </span>
              <style>{`@keyframes pulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
            </div>
          )}

          {/* Input row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            backgroundColor: inputFocused ? '#FFFFFF' : '#FAFAFA',
            border: `1.5px solid ${inputFocused ? '#1976D2' : '#E0E0E0'}`,
            borderRadius: '10px',
            padding: '6px 6px 6px 14px',
            transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
            boxShadow: inputFocused ? '0 0 0 3px rgba(25,118,210,0.1)' : 'none',
          }}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask anything about Kubeflow..."
              rows={1}
              disabled={isLoading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontFamily: '"IBM Plex Sans", sans-serif',
                fontSize: '13px',
                color: '#212121',
                resize: 'none',
                lineHeight: 1.6,
                height: '44px',
                minHeight: '44px',
                maxHeight: '140px',
                paddingTop: '10px',
                paddingBottom: '10px',
              }}
            />

            {isLoading ? (
              <button
                onClick={stopGeneration}
                title="Stop generation"
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '7px',
                  background: '#EEEEEE',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E0E0E0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#EEEEEE')}
              >
                <span style={{ width: '10px', height: '10px', background: '#616161', borderRadius: '2px', display: 'block' }} />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                title="Send (Enter)"
                style={{
                  width: '34px', height: '34px',
                  borderRadius: '7px',
                  background: canSend ? '#1976D2' : '#E0E0E0',
                  border: 'none',
                  cursor: canSend ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.15s, transform 0.1s',
                }}
                onMouseEnter={e => { if (canSend) e.currentTarget.style.background = '#1565C0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = canSend ? '#1976D2' : '#E0E0E0'; }}
                onMouseDown={e => { if (canSend) e.currentTarget.style.transform = 'scale(0.94)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8L13 8M13 8L9 4M13 8L9 12" stroke={canSend ? '#fff' : '#9E9E9E'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '2px' }}>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', color: '#BDBDBD', letterSpacing: '0.05em' }}>
              Enter to send · Shift+Enter for newline
            </span>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '9px', color: '#BDBDBD', letterSpacing: '0.05em' }}>
              3 sources · Milvus Lite · Groq
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;