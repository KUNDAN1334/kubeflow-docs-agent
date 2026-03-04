import React, { useState } from 'react';
import { Source } from '../types';
import { sourceConfig } from '../styles/theme';

interface SourceCardProps {
  source: Source;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);
  const config = sourceConfig[source.source_type] || sourceConfig.docs;
  const relevancePct = Math.round(source.score * 100);

  return (
    <div
      style={{
        borderLeft: `3px solid ${config.color}`,
        backgroundColor: '#FFFFFF',
        border: `1px solid #E0E0E0`,
        borderLeft: `3px solid ${config.color}`,
        borderRadius: '0 6px 6px 0',
        padding: '10px 12px',
        transition: 'box-shadow 0.15s',
        cursor: source.snippet ? 'pointer' : 'default',
      }}
      onClick={() => source.snippet && setExpanded(e => !e)}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
            {/* Source type badge */}
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: config.lightColor,
              color: config.color,
              fontFamily: '"DM Mono", monospace',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: '3px',
              whiteSpace: 'nowrap',
            }}>
              {config.icon} {config.label}
            </span>

            {/* Relevance score */}
            <span style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: relevancePct >= 70 ? '#2E7D32' : '#9E9E9E',
              fontWeight: 500,
            }}>
              {relevancePct}%
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '12px',
            fontWeight: 600,
            color: '#212121',
            marginBottom: '2px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {source.title}
          </div>

          {/* URL */}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              color: config.color,
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              maxWidth: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            ↗ {source.url.replace('https://', '').slice(0, 60)}{source.url.length > 65 ? '…' : ''}
          </a>
        </div>

        {/* Index number */}
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: config.lightColor,
          color: config.color,
          fontFamily: '"DM Mono", monospace',
          fontSize: '10px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
      </div>

      {/* Snippet (expandable) */}
      {expanded && source.snippet && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #EEEEEE',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          color: '#616161',
          lineHeight: 1.5,
          animation: 'fadeIn 0.15s ease',
        }}>
          {source.snippet}
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>
      )}
    </div>
  );
};
