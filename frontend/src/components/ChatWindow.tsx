import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';
import { KUBEFLOW_LOGO } from '../styles/theme';

const SUGGESTED_QUESTIONS = [
  'How do I install Kubeflow on GKE?',
  'Why is my Kubeflow Pipeline failing to start?',
  'What is the architecture of Kubeflow Pipelines?',
  'How do I configure Katib for hyperparameter tuning?',
  'What is the design decision behind KFServing?',
  'How do I fix a CrashLoopBackOff error in Kubeflow?',
];

interface EmptyStateProps {
  onSuggest: (q: string) => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onSuggest }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '36px 24px',
    gap: '26px',
  }}>
    {/* Hero */}
    <div style={{ textAlign: 'center', maxWidth: '460px' }}>
      <div style={{
        width: '52px',
        height: '52px',
        background: '#1976D2',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 14px',
        boxShadow: '0 4px 16px rgba(25,118,210,0.28)',
        overflow: 'hidden',
      }}>
        <img
          src={KUBEFLOW_LOGO}
          alt="Kubeflow"
          style={{ width: '34px', height: '34px', objectFit: 'contain' }}
          onError={(e) => {
            const el = e.currentTarget.parentElement!;
            el.innerHTML = '<span style="color:#fff;font-weight:700;font-size:24px">K</span>';
          }}
        />
      </div>
      <h2 style={{
        margin: '0 0 7px',
        fontFamily: '"IBM Plex Sans", sans-serif',
        fontWeight: 600,
        fontSize: '19px',
        color: '#212121',
        letterSpacing: '-0.02em',
      }}>
        Kubeflow Docs Agent
      </h2>
      <p style={{
        margin: 0,
        fontFamily: '"IBM Plex Sans", sans-serif',
        fontSize: '13px',
        color: '#616161',
        lineHeight: 1.65,
      }}>
        Ask questions about Kubeflow installation, pipelines, architecture, bugs, and more.
        Searches official docs, GitHub issues, and design proposals.
      </p>
    </div>

    {/* Source legend */}
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {([
        { color: '#1976D2', bg: '#E3F2FD', label: 'Official Docs' },
        { color: '#FB8C00', bg: '#FFF3E0', label: 'GitHub Issues' },
        { color: '#2E7D32', bg: '#E8F5E9', label: 'Architecture & KEPs' },
      ] as Array<{ color: string; bg: string; label: string }>).map((s) => (
        <div key={s.label} style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: s.bg,
          borderLeft: `3px solid ${s.color}`,
          padding: '5px 11px',
          borderRadius: '0 6px 6px 0',
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '12px',
          color: s.color,
          fontWeight: 500,
        }}>
          {s.label}
        </div>
      ))}
    </div>

    {/* Suggested questions */}
    <div style={{ width: '100%', maxWidth: '580px' }}>
      <div style={{
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: '9.5px',
        color: '#BDBDBD',
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        marginBottom: '9px',
        textAlign: 'center',
      }}>
        Try asking
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '7px',
      }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              padding: '9px 13px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '12px',
              color: '#424242',
              lineHeight: 1.45,
              transition: 'all 0.15s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1976D2';
              e.currentTarget.style.backgroundColor = '#E3F2FD';
              e.currentTarget.style.color = '#1565C0';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(25,118,210,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#E0E0E0';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#424242';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  </div>
);

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  activeToolLabel: string | null;
  onSuggest: (q: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSuggest }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      backgroundColor: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
      scrollbarWidth: 'thin',
      scrollbarColor: '#E0E0E0 transparent',
    }}>
      {messages.length === 0 ? (
        <EmptyState onSuggest={onSuggest} />
      ) : (
        <div style={{
          padding: '20px 24px 8px',
          maxWidth: '760px',
          width: '100%',
          margin: '0 auto',
        }}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} style={{ height: '16px' }} />
        </div>
      )}
    </div>
  );
};
