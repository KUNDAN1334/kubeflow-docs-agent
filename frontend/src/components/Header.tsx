import React from 'react';

interface HeaderProps {
  onClear: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onClear, hasMessages }) => {
  return (
    <header style={{
      backgroundColor: '#1976D2',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      borderBottom: '1px solid #1565C0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Kubeflow K logo */}
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.25)',
        }}>
          <span style={{
            color: '#FFFFFF',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: '17px',
            lineHeight: 1,
            letterSpacing: '-0.5px',
          }}>K</span>
        </div>

        <div>
          <div style={{
            color: '#FFFFFF',
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 600,
            fontSize: '15px',
            letterSpacing: '0.01em',
            lineHeight: 1.2,
          }}>
            Kubeflow Docs Agent
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.65)',
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Agentic RAG · llama-3.1-8b-instant
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '9999px',
          padding: '4px 10px',
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            display: 'inline-block',
            boxShadow: '0 0 0 2px rgba(76,175,80,0.3)',
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.85)',
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            letterSpacing: '0.05em',
          }}>LIVE</span>
        </div>

        {hasMessages && (
          <button
            onClick={onClear}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
          >
            Clear
          </button>
        )}
      </div>
    </header>
  );
};
