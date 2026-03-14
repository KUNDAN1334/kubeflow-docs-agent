import React, { useState } from 'react';
import { Source, SourceType } from '../types';
import { sourceConfig } from '../styles/theme';

interface SourceCardProps {
  source: Source;
  index: number;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const sourceType: SourceType = (['docs', 'issues', 'platform'].includes(source.source_type)
    ? source.source_type
    : 'docs') as SourceType;

  const config = sourceConfig[sourceType];
  const relevancePct = Math.round(source.score * 100);

  return (
    <div
      onClick={() => source.snippet && setExpanded(e => !e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#fff',
        border: '1px solid #E0E0E0',
        borderLeft: `3px solid ${config.color}`,
        borderRadius: '0 8px 8px 0',
        padding: '9px 12px',
        cursor: source.snippet ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s',
        boxShadow: hovered ? '0 2px 10px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              backgroundColor: config.lightColor,
              color: config.color,
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '9px',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              padding: '2px 6px',
              borderRadius: '3px',
            }}>
              {config.icon} {config.label}
            </span>
            <span style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              fontWeight: 500,
              color: relevancePct >= 70 ? '#2E7D32' : '#9E9E9E',
            }}>
              {relevancePct}%
            </span>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: '"IBM Plex Sans", sans-serif',
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
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '10px',
              color: config.color,
              textDecoration: 'none',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            ↗ {source.url.replace('https://', '').slice(0, 60)}{source.url.length > 65 ? '…' : ''}
          </a>
        </div>

        {/* Index bubble */}
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%',
          backgroundColor: config.lightColor, color: config.color,
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '10px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {index + 1}
        </div>
      </div>

      {/* Snippet */}
      {expanded && source.snippet && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #EEEEEE',
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '11.5px',
          color: '#616161',
          lineHeight: 1.55,
          animation: 'fadeIn 0.15s ease',
        }}>
          {source.snippet}
          <style>{`@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }`}</style>
        </div>
      )}
    </div>
  );
};