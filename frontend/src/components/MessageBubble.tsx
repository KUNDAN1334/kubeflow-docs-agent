import React, { useMemo } from 'react';
import { Message } from '../types';
import { SourceCard } from './SourceCard';
import { StatsBar } from './StatsBar';
import { ToolIndicator } from './ToolIndicator';
import { KUBEFLOW_LOGO } from '../styles/theme';

interface MessageBubbleProps {
  message: Message;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const lines = text.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <div key={key++} style={{ margin: '10px 0', borderRadius: '8px', overflow: 'hidden' }}>
          {lang && (
            <div style={{
              background: '#0D47A1',
              color: '#90CAF9',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '9.5px',
              padding: '4px 12px',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{lang}</span>
            </div>
          )}
          <pre style={{
            margin: 0,
            padding: '12px 14px',
            background: '#0A1929',
            color: '#E3F2FD',
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: '12px',
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            borderRadius: lang ? '0' : '8px',
          }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('### ')) { nodes.push(<h3 key={key++} style={{ margin: '10px 0 4px', fontSize: '13px', fontWeight: 600, color: '#212121', fontFamily: '"IBM Plex Sans", sans-serif' }}>{renderInline(line.slice(4))}</h3>); i++; continue; }
    if (line.startsWith('## '))  { nodes.push(<h2 key={key++} style={{ margin: '12px 0 5px', fontSize: '14px', fontWeight: 600, color: '#212121', fontFamily: '"IBM Plex Sans", sans-serif' }}>{renderInline(line.slice(3))}</h2>); i++; continue; }
    if (line.startsWith('# '))   { nodes.push(<h1 key={key++} style={{ margin: '14px 0 6px', fontSize: '15px', fontWeight: 600, color: '#212121', fontFamily: '"IBM Plex Sans", sans-serif' }}>{renderInline(line.slice(2))}</h1>); i++; continue; }

    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) { items.push(lines[i].slice(2)); i++; }
      nodes.push(<ul key={key++} style={{ margin: '6px 0', paddingLeft: '18px' }}>{items.map((it, j) => <li key={j} style={{ marginBottom: '3px', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.55 }}>{renderInline(it)}</li>)}</ul>);
      continue;
    }

    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      nodes.push(<ol key={key++} style={{ margin: '6px 0', paddingLeft: '20px' }}>{items.map((it, j) => <li key={j} style={{ marginBottom: '3px', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.55 }}>{renderInline(it)}</li>)}</ol>);
      continue;
    }

    if (line.match(/^---+$/)) { nodes.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid #E0E0E0', margin: '10px 0' }} />); i++; continue; }
    if (line.trim() === '') { nodes.push(<div key={key++} style={{ height: '5px' }} />); i++; continue; }
    nodes.push(<p key={key++} style={{ margin: '2px 0', fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.65 }}>{renderInline(line)}</p>);
    i++;
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldIdx = remaining.indexOf('**');
    const codeIdx = remaining.indexOf('`');
    const linkIdx = remaining.indexOf('[');

    const boldMatch = boldIdx >= 0 ? remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s) : null;
    const codeMatch = codeIdx >= 0 ? remaining.match(/^(.*?)`([^`]+)`(.*)/s) : null;
    const linkMatch = linkIdx >= 0 ? remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/s) : null;

    const bI = boldMatch ? boldIdx : Infinity;
    const cI = codeMatch ? codeIdx : Infinity;
    const lI = linkMatch ? linkIdx : Infinity;
    const min = Math.min(bI, cI, lI);

    if (min === Infinity) { parts.push(<span key={key++}>{remaining}</span>); break; }

    if (min === bI && boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++} style={{ fontWeight: 600 }}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    } else if (min === cI && codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(<code key={key++} style={{ background: '#E3F2FD', color: '#0D47A1', fontFamily: '"IBM Plex Mono", monospace', fontSize: '11.5px', padding: '1px 5px', borderRadius: '3px' }}>{codeMatch[2]}</code>);
      remaining = codeMatch[3];
    } else if (min === lI && linkMatch) {
      if (linkMatch[1]) parts.push(<span key={key++}>{linkMatch[1]}</span>);
      parts.push(<a key={key++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer" style={{ color: '#1976D2', textDecoration: 'none', fontWeight: 500 }} onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')} onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>{linkMatch[2]}</a>);
      remaining = linkMatch[4];
    } else {
      parts.push(<span key={key++}>{remaining}</span>); break;
    }
  }
  return <>{parts}</>;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isError = message.status === 'error';

  const rendered = useMemo(() => {
    if (!message.content) return null;
    return renderMarkdown(message.content);
  }, [message.content]);

  // User message
  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', paddingLeft: '60px', animation: 'msgIn 0.2s ease-out' }}>
        <div style={{
          background: '#E3F2FD',
          color: '#212121',
          padding: '10px 14px',
          borderRadius: '12px 12px 3px 12px',
          maxWidth: '100%',
          fontFamily: '"IBM Plex Sans", sans-serif',
          fontSize: '13px',
          lineHeight: 1.65,
          border: '1px solid #BBDEFB',
        }}>
          {message.content}
        </div>
        <style>{`@keyframes msgIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </div>
    );
  }

  // Bot message
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px', paddingRight: '48px', animation: 'msgIn 0.2s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Avatar */}
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: '#1976D2', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: '1px', overflow: 'hidden',
        }}>
          <img
            src={KUBEFLOW_LOGO}
            alt="Kubeflow"
            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
            onError={(e) => {
              const el = e.currentTarget.parentElement!;
              el.innerHTML = '<span style="color:#fff;font-weight:700;font-size:13px">K</span>';
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tool indicator while loading with no content */}
          {isStreaming && !message.content && (
            <ToolIndicator toolName={message.toolUsed || 'search_docs'} />
          )}

          {/* Content bubble */}
          {(message.content || isError) && (
            <div style={{
              background: isError ? '#FFEBEE' : '#fff',
              border: `1px solid ${isError ? '#FFCDD2' : '#E0E0E0'}`,
              borderRadius: '3px 12px 12px 12px',
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
            }}>
              {isError ? (
                <div style={{ fontFamily: '"IBM Plex Sans", sans-serif', fontSize: '13px', color: '#D32F2F' }}>
                  ⚠️ {message.content}
                </div>
              ) : (
                <>
                  {rendered}
                  {isStreaming && (
                    <span style={{
                      display: 'inline-block', width: '2px', height: '13px',
                      background: '#1976D2', marginLeft: '2px',
                      verticalAlign: 'text-bottom',
                      animation: 'blink 0.75s step-end infinite',
                    }} />
                  )}
                  <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
                </>
              )}
            </div>
          )}

          {/* Sources */}
          {!isStreaming && message.sources && message.sources.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: '9.5px',
                color: '#9E9E9E',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '7px',
              }}>
                Sources
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {message.sources.map((source, i) => (
                  <SourceCard key={i} source={source} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Stats bar */}
          {!isStreaming && message.status === 'done' && (
            <StatsBar
              toolUsed={message.toolUsed}
              latencyMs={message.latencyMs}
              sourcesCount={message.sources?.length ?? 0}
            />
          )}
        </div>
      </div>
    </div>
  );
};