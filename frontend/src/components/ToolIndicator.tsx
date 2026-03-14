import React from 'react';
import { toolMessages, toolIcons } from '../styles/theme';

interface ToolIndicatorProps {
  toolName: string;
}

export const ToolIndicator: React.FC<ToolIndicatorProps> = ({ toolName }) => {
  const label = toolMessages[toolName] || 'Thinking...';
  const icon = toolIcons[toolName] || '🔍';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 14px',
      backgroundColor: '#E3F2FD',
      border: '1px solid #BBDEFB',
      borderRadius: '10px',
      width: 'fit-content',
      marginTop: '2px',
    }}>
      <span style={{ fontSize: '14px', lineHeight: 1 }}>{icon}</span>
      <span style={{
        fontFamily: '"IBM Plex Sans", sans-serif',
        fontSize: '13px',
        color: '#1565C0',
        fontWeight: 500,
      }}>
        {label}
      </span>
      <Dots />
    </div>
  );
};

const Dots: React.FC = () => (
  <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
    {[0, 1, 2].map(i => (
      <span key={i} style={{
        width: '5px', height: '5px', borderRadius: '50%',
        backgroundColor: '#1976D2', display: 'inline-block',
        animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
      }} />
    ))}
    <style>{`
      @keyframes dotPulse {
        0%, 80%, 100% { opacity: 0.2; transform: scale(0.75); }
        40% { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </span>
);