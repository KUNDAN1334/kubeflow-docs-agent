import React from 'react';
import { KUBEFLOW_LOGO } from '../styles/theme';

interface HeaderProps {
  onClear: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onClear, hasMessages }) => {
  return (
    <header style={{
      backgroundColor: '#1976D2',
      padding: '0 20px',
      height: '54px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      borderBottom: '1px solid #1565C0',
    }}>
      {/* Left: Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '30px',
          height: '30px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '6px',
          border: '1px solid rgba(255,255,255,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <img
            src={KUBEFLOW_LOGO}
            alt="Kubeflow"
            style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            onError={(e) => {
              const el = e.currentTarget.parentElement!;
              el.innerHTML = '<span style="color:#fff;font-weight:700;font-size:15px">K</span>';
            }}
          />
        </div>

        <div>
          <div style={{
            color: '#fff',
            fontFamily: '"IBM Plex Sans", sans-serif',
            fontWeight: 600,
            fontSize: '14.5px',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}>
            Kubeflow Docs Agent
          </div>
          <div style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '9.5px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Agentic RAG · llama-3.1-8b-instant
          </div>
        </div>
      </div>

      {/* Right: Live badge + Clear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Live badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: '9999px',
          padding: '3px 10px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#4CAF50',
            boxShadow: '0 0 0 2px rgba(76,175,80,0.3)',
            display: 'inline-block',
          }} />
          <span style={{
            color: 'rgba(255,255,255,0.85)',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '9.5px',
            letterSpacing: '0.06em',
          }}>
            LIVE
          </span>
        </div>

        {hasMessages && (
          <button
            onClick={onClear}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.85)',
              fontFamily: '"IBM Plex Sans", sans-serif',
              fontSize: '12px',
              fontWeight: 500,
              padding: '4px 12px',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          >
            Clear
          </button>
        )}
      </div>
    </header>
  );
};