import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/chat-context';
import { WelcomeState } from '../welcome-state/WelcomeState';
import { ChatInput } from '../chat-input/ChatInput';
import { BASE_URL } from '../../../data/datasources/chat-api-datasource';
import './ChatArea.css';

export const ChatArea: React.FC = () => {
  const {
    activeChat,
    messages,
    loading,
    streamingMessageId,
    streamingText,
    isSidebarOpen,
    setSidebarOpen,
    personalities,
    shareChat,
    regenerateLastResponse
  } = useChat();

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Clear speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Handle TTS playback
  const handleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined') return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean up code blocks and html markup for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/<[^>]*>/g, '') // Remove HTML
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const isIndonesian = /[aeiou]nd[ao]|dan|yang|untuk|dengan|adalah|bisa|saya|kamu/i.test(cleanText);
    utterance.lang = isIndonesian ? 'id-ID' : 'en-US';

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  // Handle copying message text
  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExportOptions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, loading]);

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? `https://www.youtube.com/embed/${match[2]}`
      : null;
  };

  // Find active personality name
  const currentPersonality = activeChat
    ? personalities.find((p) => p.id === activeChat.personalityId)
    : null;

  // Handle Share link generation
  const handleShareClick = async () => {
    if (!activeChat) return;
    try {
      const token = await shareChat(activeChat.id);
      const shareUrl = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      console.error('Failed to share chat:', e);
    }
  };

  // Handle Export File Generation
  const handleExport = (format: 'markdown' | 'json') => {
    if (!activeChat || messages.length === 0) return;

    let fileContent = '';
    let mimeType = 'text/plain';
    let fileExtension = '';

    const safeTitle = activeChat.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'markdown') {
      mimeType = 'text/markdown';
      fileExtension = 'md';

      fileContent = `# Chat Session: ${activeChat.title}\n`;
      fileContent += `Date: ${activeChat.createdAt.toLocaleString()}\n`;
      fileContent += `Model Slot: ${activeChat.model || 'openai'}\n`;
      fileContent += `Agent: ${currentPersonality?.name ?? 'Unknown'}\n`;
      fileContent += `==================================================\n\n`;

      messages.forEach((msg) => {
        const role = msg.sender === 'user' ? 'User' : (currentPersonality?.name ?? 'AI');
        fileContent += `### **${role}**\n\n${msg.content}\n\n---\n\n`;
      });
    } else {
      mimeType = 'application/json';
      fileExtension = 'json';

      const payload = {
        chatId: activeChat.id,
        title: activeChat.title,
        createdAt: activeChat.createdAt,
        model: activeChat.model,
        agent: {
          id: currentPersonality?.id,
          name: currentPersonality?.name,
          systemPrompt: currentPersonality?.systemPrompt,
        },
        messages: messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          createdAt: m.createdAt,
        })),
      };
      fileContent = JSON.stringify(payload, null, 2);
    }

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `garionx_chat_${safeTitle}.${fileExtension}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportOptions(false);
  };

  // Helper to parse images (![alt](url)), bold (**text**) and italics (*text*)
  const parseMarkdownText = (text: string) => {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Parse images: ![alt](url)
    escaped = escaped.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="chat-image" />');
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

  // Helper to parse keywords, strings, comments in code blocks
  const highlightCode = (code: string) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const tokens = [
      { type: 'comment', regex: /(\/\/.*|\/\*[\s\S]*?\*\/|#.*)/g },
      { type: 'string', regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g },
      { type: 'number', regex: /\b(\d+(?:\.\d+)?)\b/g },
      { type: 'keyword', regex: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|default|extends|new|this|async|await|try|catch|finally|throw|typeof|instanceof|public|private|protected|static|readonly|namespace|interface|type|implements|as|any|string|number|boolean|void)\b/g },
      { type: 'function', regex: /\b(\w+)(?=\s*\()/g },
    ];

    let highlighted = escaped;
    const placeholders: string[] = [];

    const getPlaceholder = (type: string, content: string) => {
      const idx = placeholders.length;
      placeholders.push(`<span class="syntax-${type}">${content}</span>`);
      return `___SYNTAX_PLACEHOLDER_${idx}___`;
    };

    // 1. Comments
    highlighted = highlighted.replace(tokens[0].regex, (m) => getPlaceholder('comment', m));
    // 2. Strings
    highlighted = highlighted.replace(tokens[1].regex, (m) => getPlaceholder('string', m));
    // 3. Keywords
    highlighted = highlighted.replace(tokens[3].regex, (m) => getPlaceholder('keyword', m));
    // 4. Functions
    highlighted = highlighted.replace(tokens[4].regex, (m) => getPlaceholder('function', m));
    // 5. Numbers
    highlighted = highlighted.replace(tokens[2].regex, (m) => getPlaceholder('number', m));

    let finalHtml = highlighted;
    for (let i = 0; i < placeholders.length; i++) {
      finalHtml = finalHtml.replace(`___SYNTAX_PLACEHOLDER_${i}___`, placeholders[i]);
    }

    return <code dangerouslySetInnerHTML={{ __html: finalHtml }} />;
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
            {highlightCode(code)}
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

  return (
    <main className="chat-area neon-grid-bg">
      {/* Top Header Panel */}
      <header className="chat-header glass-panel">
        <button
          className={`menu-toggle-btn ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <path d="M14 9l3 3-3 3" />
            </svg>
          )}
        </button>

        <div className="header-meta">
          <h2 className="header-chat-title">
            {activeChat ? activeChat.title : 'New Session'}
          </h2>
          <div className="model-badge">
            <span className="badge-glow-dot"></span>
            <span>{currentPersonality ? currentPersonality.name : 'Ready'}</span>
          </div>
        </div>

        {/* Share & Export Chat Action Group */}
        {activeChat && messages.length > 0 && (
          <div className="header-actions-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Share link button */}
            <div className="share-btn-container">
              <button
                className={`share-trigger-btn ${copiedLink ? 'copied' : ''}`}
                onClick={handleShareClick}
                title="Copy Shareable Link"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                <span>{copiedLink ? 'Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Export dropdown */}
            <div className="header-export-container" ref={dropdownRef}>
              <button
                className="export-trigger-btn"
                onClick={() => setShowExportOptions(!showExportOptions)}
                title="Export Conversation"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export</span>
              </button>
              {showExportOptions && (
                <div className="export-dropdown glass-panel">
                  <button onClick={() => handleExport('markdown')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Markdown (.md)
                  </button>
                  <button onClick={() => handleExport('json')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"></path>
                      <path d="M18 8h6v11a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V8z"></path>
                    </svg>
                    JSON Format
                  </button>
                  <button onClick={() => { setShowExportOptions(false); if (typeof window !== 'undefined') window.print(); }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}>
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print Dossier (PDF)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Message list container */}
      <div className="chat-messages-container">
        {messages.length === 0 && !loading ? (
          <WelcomeState />
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const isLastMessage = index === messages.length - 1;
              return (
                <div key={msg.id} className={`message-row ${isUser ? 'user-row' : 'bot-row'}`}>
                  {!isUser && (
                    <div className="bot-avatar-wrapper">
                      <div className="bot-avatar-label">
                        {currentPersonality ? currentPersonality.name[0] : 'G'}
                      </div>
                    </div>
                  )}
                  <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    {msg.attachmentUrl && (
                      <div className="message-attachment-container">
                        {msg.attachmentType === 'video' ? (
                          <div className="message-attachment-video-wrapper">
                            {getYoutubeEmbedUrl(msg.attachmentUrl) ? (
                              <iframe
                                src={getYoutubeEmbedUrl(msg.attachmentUrl)!}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="message-attachment-video"
                                style={{ border: 'none', aspectRatio: '16/9', height: '220px', width: '100%', maxWidth: '100%' }}
                              />
                            ) : (
                              <video src={msg.attachmentUrl.startsWith('http') ? msg.attachmentUrl : `${BASE_URL}${msg.attachmentUrl}`} controls className="message-attachment-video" />
                            )}
                          </div>
                        ) : (
                          <div className="message-attachment-image-wrapper">
                            <img src={msg.attachmentUrl.startsWith('http') ? msg.attachmentUrl : `${BASE_URL}${msg.attachmentUrl}`} alt="Attachment" className="message-attachment-image" />
                          </div>
                        )}
                      </div>
                    )}
                    {msg.content && (
                      <div className="message-content">
                        {renderMessageContent(msg.content)}
                      </div>
                    )}

                    {/* User Message Action Panel (Copy) */}
                    {isUser && msg.content && (
                      <div className="user-message-actions">
                        <button
                          className={`copy-msg-btn user-copy-btn ${copiedMessageId === msg.id ? 'copied' : ''}`}
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy message to clipboard"
                        >
                          {copiedMessageId === msg.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                          <span>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                    
                    {/* Bot Message Action Panel (Speak & Regenerate) */}
                    {!isUser && (
                      <div className="bot-message-actions">
                        <button
                          className={`speak-btn ${speakingMessageId === msg.id ? 'speaking' : ''}`}
                          onClick={() => handleSpeak(msg.id, msg.content)}
                          title={speakingMessageId === msg.id ? "Stop Reading" : "Read Aloud (Text-to-Speech)"}
                        >
                          {speakingMessageId === msg.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="audio-pulse-icon">
                              <line x1="6" y1="4" x2="6" y2="20" />
                              <line x1="12" y1="8" x2="12" y2="16" />
                              <line x1="18" y1="1" x2="18" y2="23" />
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          )}
                          <span>{speakingMessageId === msg.id ? 'Stop' : 'Speak'}</span>
                        </button>

                        <button
                          className={`copy-msg-btn ${copiedMessageId === msg.id ? 'copied' : ''}`}
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          title="Copy message to clipboard"
                        >
                          {copiedMessageId === msg.id ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          )}
                          <span>{copiedMessageId === msg.id ? 'Copied!' : 'Copy'}</span>
                        </button>

                        {isLastMessage && !loading && !streamingMessageId && (
                          <button
                            className="regenerate-btn"
                            onClick={regenerateLastResponse}
                            title="Get another response"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                            </svg>
                            <span>Regenerate</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Simulated AI streaming text bubble */}
            {streamingMessageId && (
              <div className="message-row bot-row">
                <div className="message-bubble bot-bubble">
                  <div className="bot-avatar-label">
                    {currentPersonality ? currentPersonality.name[0] : 'G'}
                  </div>
                  <div className="message-content">
                    {renderMessageContent(streamingText)}
                    <span className="blinking-cursor"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting loader for bot to respond initially */}
            {loading && !streamingMessageId && (
              <div className="message-row bot-row">
                <div className="message-bubble bot-bubble typing-indicator-bubble">
                  <div className="bot-avatar-label">
                    {currentPersonality ? currentPersonality.name[0] : 'G'}
                  </div>
                  <div className="typing-indicator">
                    <span className="dot animate-dot-1"></span>
                    <span className="dot animate-dot-2"></span>
                    <span className="dot animate-dot-3"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <ChatInput />
    </main>
  );
};
