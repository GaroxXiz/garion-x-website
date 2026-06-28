'use client';

import React, { useEffect, useState, useRef } from 'react';
import { apiDataSource, BASE_URL } from '../../../data/datasources/chat-api-datasource';
import { Logo } from '../../../presentation/components/logo/Logo';
import './share.css';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  createdAt: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

interface SharedChatData {
  title: string;
  personalityName: string;
  model: string;
  createdAt: string;
  messages: Message[];
}

// Cinematic Image-to-Video Player for AnimateX simulation on share page
const CinematicVideoPlayer: React.FC<{ src: string }> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 50);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    setProgress(percentage);
  };

  return (
    <div className="cinematic-video-container">
      {/* Animated Image */}
      <div className={`cinematic-video-viewport ${isPlaying ? 'playing' : 'paused'}`} onClick={() => setIsPlaying(!isPlaying)}>
        <img src={src} className="cinematic-video-image" alt="Animated AI Output" />
        
        {/* Cinematic VFX Overlays */}
        <div className="cinematic-overlay-lightleak" />
        <div className="cinematic-overlay-grid" />
        <div className="cinematic-overlay-particles" />
        
        {/* Play Button Overlay when Paused */}
        {!isPlaying && (
          <div className="cinematic-play-center-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="cinematic-video-controls">
        <button type="button" className="cinematic-control-btn" onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        
        {/* Progress Timeline */}
        <div className="cinematic-progress-bar-container" onClick={handleTimelineClick}>
          <div className="cinematic-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {/* Timecode */}
        <span className="cinematic-timecode">
          0:0{Math.floor((progress / 100) * 5)} / 0:05
        </span>
      </div>
    </div>
  );
};

export default function SharedChatPage({ params }: { params: Promise<{ token: string }> | { token: string } }) {
  const [data, setData] = useState<SharedChatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Video Action Handlers
  const handleDownloadVideo = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'garionx_video.mp4';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyVideoLink = (url: string) => {
    navigator.clipboard.writeText(url);
    alert('Video link copied to clipboard!');
  };

  const handleShareVideo = (url: string) => {
    if (navigator.share) {
      navigator.share({
        title: 'GarionX Animated Video',
        text: 'Lihat video animasi siber hasil AI GarionX ini!',
        url: url
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(url);
      alert('Video link copied to clipboard!');
    }
  };

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
              
              const getYoutubeEmbedUrl = (url: string) => {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = url.match(regExp);
                return (match && match[2].length === 11)
                  ? `https://www.youtube.com/embed/${match[2]}`
                  : null;
              };

              return (
                <div key={msg.id} className={`message-row ${isUser ? 'user-row' : 'bot-row'}`}>
                  <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
                    {!isUser && (
                      <div className="bot-avatar-label">
                        {data.personalityName[0] || 'G'}
                      </div>
                    )}
                    
                    {msg.attachmentUrl && (
                      <div className="message-attachment-container">
                        {msg.attachmentType === 'video' ? (
                          <div className="message-attachment-video-wrapper" style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}>
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
                            ) : (() => {
                              const videoUrl = msg.attachmentUrl!.startsWith('http') ? msg.attachmentUrl! : `${BASE_URL}${msg.attachmentUrl}`;
                              return (
                                <>
                                  {(() => {
                                    const lowerUrl = msg.attachmentUrl!.toLowerCase();
                                    const isFallbackSimulation = 
                                      lowerUrl.endsWith('.png') ||
                                      lowerUrl.endsWith('.jpg') ||
                                      lowerUrl.endsWith('.jpeg') ||
                                      lowerUrl.endsWith('.webp') ||
                                      lowerUrl.endsWith('.gif') ||
                                      lowerUrl.includes('/uploads/');
                                    return isFallbackSimulation ? (
                                      <CinematicVideoPlayer src={videoUrl} />
                                    ) : (
                                      <video src={videoUrl} controls className="message-attachment-video" />
                                    );
                                  })()}
                                  <div className="video-action-bar">
                                    <button type="button" className="video-action-btn" onClick={() => handleDownloadVideo(videoUrl, 'garionx_video.mp4')} title="Download Video">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                                      </svg>
                                      <span>Save</span>
                                    </button>
                                    <button type="button" className="video-action-btn" onClick={() => handleCopyVideoLink(videoUrl)} title="Copy Video Link">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                      </svg>
                                      <span>Copy Link</span>
                                    </button>
                                    <button type="button" className="video-action-btn" onClick={() => handleShareVideo(videoUrl)} title="Share Video Link">
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="18" cy="5" r="3"></circle>
                                        <circle cx="6" cy="12" r="3"></circle>
                                        <circle cx="18" cy="19" r="3"></circle>
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                                      </svg>
                                      <span>Share</span>
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="message-attachment-image-wrapper">
                            <img src={msg.attachmentUrl!.startsWith('http') ? msg.attachmentUrl! : `${BASE_URL}${msg.attachmentUrl}`} alt="Attachment" className="message-attachment-image" />
                          </div>
                        )}
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
