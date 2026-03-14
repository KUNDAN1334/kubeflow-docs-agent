import React from 'react';
import { ToolType } from '../types';
import { sourceConfig } from '../styles/theme';

interface StatsBarProps {
  toolUsed?: ToolType;
  latencyMs?: number;
  sourcesCount: number;
}

const toolToSourceType = {
  search_docs: 'docs',
  search_issues: 'issues',
  search_platform: 'platform',
} as const;

const toolLabels: Record<string, string> = {
  search_docs: 'docs',
  search_issues: 'issues',
  search_platform: 'platform',
};

export const StatsBar: React.FC<StatsBarProps> = ({ toolUsed, latencyMs, sourcesCount }) => {
  const sourceType = toolUsed ? toolToSourceType[toolUsed] : 'docs';
  const config = sourceConfig[sourceType];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      marginTop: '10px',
      flexWrap: 'wrap',
    }}>
      {latencyMs !== undefined && (
        <StatChip
          icon="⚡"
          label={latencyMs < 1000 ? `${latencyMs}ms` : `${(latencyMs / 1000).toFixed(1)}s`}
          color="#616161"
          bg="#F5F5F5"
        />
      )}
      {toolUsed && (
        <StatChip
          icon={config?.icon || '🔍'}
          label={toolLabels[toolUsed] || toolUsed}
          color={config?.color || '#1976D2'}
          bg={config?.lightColor || '#E3F2FD'}
        />
      )}
      <StatChip
        icon="📚"
        label={`${sourcesCount} source${sourcesCount !== 1 ? 's' : ''}`}
        color="#616161"
        bg="#F5F5F5"
      />
    </div>
  );
};

const StatChip: React.FC<{ icon: string; label: string; color: string; bg: string }> = ({
  icon, label, color, bg,
}) => (
  <div style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: bg,
    color,
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.03em',
    padding: '3px 8px',
    borderRadius: '4px',
    userSelect: 'none',
  }}>
    <span style={{ fontSize: '10px', lineHeight: 1 }}>{icon}</span>
    {label}
  </div>
);