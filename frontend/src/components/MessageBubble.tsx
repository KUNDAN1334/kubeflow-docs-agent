import React, { useMemo } from 'react';
import { Message } from '../types';
import { SourceCard } from './SourceCard';
import { StatsBar } from './StatsBar';
import { ToolIndicator } from './ToolIndicator';

interface MessageBubbleProps {
  message: Message;
}

// Minimal markdown renderer — handles code blocks, bold, inline code, links, headings
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
        <div key={key++} style={{ margin: '10px 0', position: 'relative' }}>
          {lang && (
            <div style={{
              backgroundColor: '#0D47A1',
              color: '#90CAF9',
              fontFamily: '"DM Mono", monospace',
              fontSize: '10px',
              padding: '4px 10px',
              borderRadius: '6px 6px 0 0',
              letterSpacing: '0.05em',
            }}>
              {lang}
            </div>
          )}
          <pre style={{
            margin: 0,
            padding: '12px 14px',
            backgroundColor: '#0A1929',
            color: '#E3F2FD',
            fontFamily: '"DM Mono", monospace',
            fontSize: '12px',
            lineHeight: 1.6,
            borderRadius: lang ? '0 0 6px 6px' : '6px',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      i++;
      continue;
    }

    // Heading
    if (line.startsWith('### ')) {
      nodes.push(<h3 key={key++} style={{ margin: '12px 0 4px', fontSize: '13px', fontWeight: 700, color: '#212121', fontFamily: '"DM Sans", sans-serif' }}>{renderInline(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      nodes.push(<h2 key={key++} style={{ margin: '14px 0 5px', fontSize: '14px', fontWeight: 700, color: '#212121', fontFamily: '"DM Sans", sans-serif' }}>{renderInline(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith('# ')) {
      nodes.push(<h1 key={key++} style={{ margin: '14px 0 6px', fontSize: '15px', fontWeight: 700, color: '#212121', fontFamily: '"DM Sans", sans-serif' }}>{renderInline(line.slice(2))}</h1>);
      i++; continue;
    }

    // Bullet list
    if (line.match(/^[-*] /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^[-*] /)) {
        items.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <ul key={key++} style={{ margin: '6px 0', paddingLeft: '18px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: '3px', fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.5 }}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''));
        i++;
      }
      nodes.push(
        <ol key={key++} style={{ margin: '6px 0', paddingLeft: '20px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: '3px', fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.5 }}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      nodes.push(<hr key={key++} style={{ border: 'none', borderTop: '1px solid #E0E0E0', margin: '10px 0' }} />);
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      nodes.push(<div key={key++} style={{ height: '6px' }} />);
      i++; continue;
    }

    // Paragraph
    nodes.push(
      <p key={key++} style={{ margin: '2px 0', fontFamily: '"DM Sans", sans-serif', fontSize: '13px', color: '#212121', lineHeight: 1.6 }}>
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return nodes;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*(.*?)\*\*(.*)/s);
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)/s);
    // Link
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)/s);

    const boldIdx = boldMatch ? remaining.indexOf('**') : Infinity;
    const codeIdx = codeMatch ? remaining.indexOf('`') : Infinity;
    const linkIdx = linkMatch ? remaining.indexOf('[') : Infinity;

    const minIdx = Math.min(boldIdx, codeIdx, linkIdx);

    if (minIdx === Infinity) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (minIdx === boldIdx && boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
    } else if (minIdx === codeIdx && codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code key={key++} style={{
          backgroundColor: '#F0F4FF',
          color: '#0D47A1',
          fontFamily: '"DM Mono", monospace',
          fontSize: '11px',
          padding: '1px 5px',
          borderRadius: '3px',
        }}>{codeMatch[2]}</code>
      );
      remaining = codeMatch[3];
    } else if (minIdx === linkIdx && linkMatch) {
      if (linkMatch[1]) parts.push(<span key={key++}>{linkMatch[1]}</span>);
      parts.push(
        <a key={key++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#1976D2', textDecoration: 'none', fontWeight: 500 }}
          onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
        >{linkMatch[2]}</a>
      );
      remaining = linkMatch[4];
    } else {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
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

  if (isUser) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '16px',
        paddingLeft: '60px',
      }}>
        <div style={{
          backgroundColor: '#E3F2FD',
          color: '#212121',
          padding: '10px 14px',
          borderRadius: '14px 14px 2px 14px',
          maxWidth: '100%',
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '13px',
          lineHeight: 1.6,
          border: '1px solid #BBDEFB',
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '20px',
      paddingRight: '60px',
    }}>
      {/* Avatar + Tool indicator row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '6px' }}>
        {/* K avatar */}
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: '#1976D2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}>
          <span style={{ color: '#fff', fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '14px' }}>K</span>
        </div>

        {/* Tool indicator when streaming and no content yet */}
        {isStreaming && !message.content && message.toolUsed && (
          <ToolIndicator toolName={message.toolUsed} />
        )}
        {isStreaming && !message.content && !message.toolUsed && (
          <ToolIndicator toolName="search_docs" />
        )}
      </div>

      {/* Content bubble */}
      {(message.content || isError) && (
        <div style={{
          marginLeft: '38px',
          backgroundColor: isError ? '#FFEBEE' : '#FFFFFF',
          border: `1px solid ${isError ? '#FFCDD2' : '#E0E0E0'}`,
          borderRadius: '2px 12px 12px 12px',
          padding: '12px 14px',
        }}>
          {isError ? (
            <div style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '13px',
              color: '#D32F2F',
            }}>
              ⚠️ {message.content}
            </div>
          ) : (
            <>
              {rendered}
              {/* Streaming cursor */}
              {isStreaming && (
                <span style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '14px',
                  backgroundColor: '#1976D2',
                  marginLeft: '2px',
                  verticalAlign: 'text-bottom',
                  animation: 'blink 0.8s step-end infinite',
                }} />
              )}
            </>
          )}

          <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
        </div>
      )}

      {/* Sources */}
      {!isStreaming && message.sources && message.sources.length > 0 && (
        <div style={{ marginLeft: '38px', marginTop: '10px' }}>
          <div style={{
            fontFamily: '"DM Mono", monospace',
            fontSize: '10px',
            color: '#9E9E9E',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '6px',
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
        <div style={{ marginLeft: '38px' }}>
          <StatsBar
            toolUsed={message.toolUsed}
            latencyMs={message.latencyMs}
            sourcesCount={message.sources?.length ?? 0}
          />
        </div>
      )}
    </div>
  );
};
