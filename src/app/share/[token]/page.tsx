'use client';

import React, { useEffect, useState } from 'react';
import { apiDataSource } from '../../../data/datasources/chat-api-datasource';
import { Logo } from '../../../presentation/components/logo/Logo';
import './share.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface SharedChatData {
  title: string;
  personalityName: string;
  model: string;
  createdAt: string;
  messages: Message[];
}

export default function SharedChatPage({ params }: { params: Promise<{ token: string }> | { token: string } }) {
  const [data, setData] = useState<SharedChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to parse bold (**text**) and italics (*text*)
  const parseMarkdownText = (text: string) => {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Parse bold (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Parse italics (*text*)
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  // Helper to render lists and paragraphs
  const renderParagraphsLine = (line: string, idx: number) => {
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return <li key={idx} className="list-item">{parseMarkdownText(line.substring(2))}</li>;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const dotIndex = line.indexOf('.');
      return <li key={idx} className="list-item decimal">{parseMarkdownText(line.substring(dotIndex + 1).trim())}</li>;
    }
    return line.trim() === '' ? <br key={idx} /> : <p key={idx} className="paragraph-line">{parseMarkdownText(line)}</p>;
  };

  // Helper to parse text segment tables
  const parseTextWithTables = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: number) => {
      if (tableRows.length === 0) return null;
      
      const headers = tableRows[0];
      const hasDivider = tableRows.length > 1 && tableRows[1].every(cell => cell.trim().startsWith('-') || cell.trim() === '');
      const dataRows = hasDivider ? tableRows.slice(2) : tableRows.slice(1);

      return (
        <div key={`table-${key}`} className="table-container">
          <table className="markdown-table">
            <thead>
              <tr>
                {headers.map((h, idx) => <th key={idx}>{parseMarkdownText(h.trim())}</th>)}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => <td key={cIdx}>{parseMarkdownText(cell.trim())}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('|') && line.endsWith('|')) {
        inTable = true;
        const cells = line.split('|').slice(1, -1);
        tableRows.push(cells);
      } else {
        if (inTable) {
          elements.push(flushTable(i));
          inTable = false;
          tableRows = [];
        }
        elements.push(renderParagraphsLine(lines[i], i));
      }
    }

    if (inTable) {
      elements.push(flushTable(lines.length));
    }

    return elements;
  };

  // Render markdown code blocks + text with tables
  const renderMessageContent = (content: string) => {
    if (!content) return null;

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      const language = match[1] || 'code';
      const code = match[2];

      if (textBefore) {
        parts.push(<span key={lastIndex} className="text-content">{parseTextWithTables(textBefore)}</span>);
      }

      parts.push(
        <div key={match.index} className="code-block-container">
          <div className="code-block-header">
            <span>{language}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="copy-code-btn"
            >
              Copy
            </button>
          </div>
          <pre className="code-block-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = codeBlockRegex.lastIndex;
    }

    const textRemaining = content.substring(lastIndex);
    if (textRemaining) {
      parts.push(<span key={lastIndex} className="text-content">{parseTextWithTables(textRemaining)}</span>);
    }

    return parts.length > 0 ? parts : parseTextWithTables(content);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Resolve params if it's a promise (Next.js 15 compatibility)
        const resolvedParams = 'then' in params ? await params : params;
        const token = resolvedParams.token;
        
        const res = await apiDataSource.getSharedChat(token);
        setData(res);
      } catch (err: any) {
        console.error('Error fetching shared chat:', err);
        setError(err.message || 'Shared chat not found or has been set to private.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  if (loading) {
    return (
      <div className="share-loading-container neon-grid-bg">
        <div className="typing-indicator" style={{ display: 'flex', gap: '4px', height: '20px', alignItems: 'center' }}>
          <span className="dot animate-dot-1" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'typingGlow 1.2s infinite 0s' }}></span>
          <span className="dot animate-dot-2" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'typingGlow 1.2s infinite 0.2s' }}></span>
          <span className="dot animate-dot-3" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-muted)', animation: 'typingGlow 1.2s infinite 0.4s' }}></span>
        </div>
        <p className="loading-text">DECRYPTING SECURE LOG DATA...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="share-error-container neon-grid-bg">
        <div className="error-panel glass-panel">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <h3>ACCESS DENIED</h3>
          <p>{error || 'The requested transmission log could not be established.'}</p>
          <a href="/" className="back-btn glow-effect">RETURN TO STATION</a>
        </div>
      </div>
    );
  }

  return (
    <div className="share-layout neon-grid-bg">
      <header className="share-header glass-panel">
        <div className="share-brand">
          <Logo size="sm" />
          <span className="brand-name">GarionX Log</span>
        </div>
        <div className="share-meta-info">
          <div className="model-badge">
            <span className="badge-glow-dot"></span>
            <span>{data.personalityName} ({data.model})</span>
          </div>
          <a href="/" className="try-btn glow-effect">CHAT WITH AI</a>
        </div>
      </header>

      <main className="share-content-container">
        <div className="share-log-header">
          <h1 className="share-title">{data.title}</h1>
          <p className="share-timestamp">Log Session Created: {new Date(data.createdAt).toLocaleString()}</p>
        </div>

        <div className="share-messages">
          <div className="messages-list">
            {data.messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={msg.id} className={`message-row ${isUser ? 'user-row' : 'bot-row'}`}>
                  <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    {!isUser && (
                      <div className="bot-avatar-label">
                        {data.personalityName[0] || 'G'}
                      </div>
                    )}
                    <div className="message-content">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="share-footer">
        <p>Garion-X secure read-only public archive transmission. IP log registered.</p>
      </footer>
    </div>
  );
}
