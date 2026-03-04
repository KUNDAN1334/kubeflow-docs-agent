import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  activeToolLabel: string | null;
}

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
    padding: '40px 24px',
    gap: '32px',
  }}>
    {/* Hero */}
    <div style={{ textAlign: 'center', maxWidth: '480px' }}>
      <div style={{
        width: '56px',
        height: '56px',
        backgroundColor: '#1976D2',
        borderRadius: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 4px 16px rgba(25,118,210,0.25)',
      }}>
        <span style={{ color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '28px' }}>K</span>
      </div>
      <h2 style={{
        margin: '0 0 8px',
        fontFamily: '"DM Sans", sans-serif',
        fontWeight: 600,
        fontSize: '20px',
        color: '#212121',
        letterSpacing: '-0.01em',
      }}>
        Kubeflow Docs Agent
      </h2>
      <p style={{
        margin: 0,
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '13px',
        color: '#616161',
        lineHeight: 1.6,
      }}>
        Ask questions about Kubeflow — installation, pipelines, architecture, bugs, and more. Searches official docs, GitHub issues, and design proposals.
      </p>
    </div>

    {/* Source legend */}
    <div style={{
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    }}>
      {[
        { color: '#1976D2', bg: '#E3F2FD', icon: '📄', label: 'Official Docs' },
        { color: '#FF6F00', bg: '#FFF3E0', icon: '🐛', label: 'GitHub Issues' },
        { color: '#2E7D32', bg: '#E8F5E9', icon: '🏗️', label: 'Architecture & KEPs' },
      ].map(s => (
        <div key={s.label} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: s.bg,
          border: `1px solid ${s.color}22`,
          borderLeft: `3px solid ${s.color}`,
          padding: '6px 12px',
          borderRadius: '0 6px 6px 0',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '12px',
          color: s.color,
          fontWeight: 500,
        }}>
          <span>{s.icon}</span> {s.label}
        </div>
      ))}
    </div>

    {/* Suggested questions */}
    <div style={{ width: '100%', maxWidth: '600px' }}>
      <div style={{
        fontFamily: '"DM Mono", monospace',
        fontSize: '10px',
        color: '#9E9E9E',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '10px',
        textAlign: 'center',
      }}>
        Try asking
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '8px',
      }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E0E0E0',
              borderRadius: '8px',
              padding: '10px 14px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '12px',
              color: '#424242',
              lineHeight: 1.4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#1976D2';
              e.currentTarget.style.backgroundColor = '#F5F9FF';
              e.currentTarget.style.color = '#1976D2';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#E0E0E0';
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#424242';
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export const ChatWindow: React.FC<ChatWindowProps & { onSuggest: (q: string) => void }> = ({
  messages,
  isLoading,
  onSuggest,
}) => {
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
    }}>
      {messages.length === 0 ? (
        <EmptyState onSuggest={onSuggest} />
      ) : (
        <div style={{ padding: '24px 24px 8px', maxWidth: '780px', width: '100%', margin: '0 auto' }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          <div ref={bottomRef} style={{ height: '16px' }} />
        </div>
      )}
    </div>
  );
};
