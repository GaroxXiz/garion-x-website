import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/chat-context';
import { WelcomeState } from '../welcome-state/WelcomeState';
import { ChatInput } from '../chat-input/ChatInput';
import { BASE_URL } from '../../../data/datasources/chat-api-datasource';
import './ChatArea.css';

// Cinematic Image-to-Video Player for AnimateX simulation
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

// Safe Mermaid diagram visualizer component loading CDN dynamically
const MermaidVisualizer: React.FC<{ chart: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      try {
        if (!(window as any).mermaid) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
            script.async = true;
            script.onload = () => {
              (window as any).mermaid.initialize({
                startOnLoad: false,
                theme: 'dark',
                securityLevel: 'loose',
                themeVariables: {
                  background: '#070a13',
                  primaryColor: '#0088ff',
                  primaryTextColor: '#ffffff',
                  lineColor: '#00ffcc'
                }
              });
              resolve();
            };
            script.onerror = () => reject(new Error('Mermaid CDN failed to load'));
            document.body.appendChild(script);
          });
        }

        if (!isMounted) return;

        const mermaidInstance = (window as any).mermaid;
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        let cleanChart = chart.trim();
        if (cleanChart.startsWith('mermaid')) {
          cleanChart = cleanChart.substring(7).trim();
        }

        const { svg: renderedSvg } = await mermaidInstance.render(id, cleanChart);
        if (isMounted) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to parse Mermaid diagram.');
        }
      }
    };

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="mermaid-error-box" style={{
        padding: '10px',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '6px',
        color: '#f87171',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap',
        textAlign: 'left'
      }}>
        <div>⚠️ Mermaid Parsing Details:</div>
        <div style={{ marginTop: '4px', fontSize: '0.72rem', opacity: 0.8 }}>{error}</div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="mermaid-loading-box" style={{
        padding: '20px',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Rendering flow chart...
      </div>
    );
  }

  return (
    <div 
      className="mermaid-rendered-container" 
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{
        backgroundColor: '#070a13',
        border: '1px solid rgba(0, 217, 255, 0.1)',
        borderRadius: '6px',
        padding: '16px',
        overflowX: 'auto',
        display: 'flex',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 15px rgba(0, 217, 255, 0.03)'
      }}
    />
  );
};

// Animated Audio Waveform component showing neon bouncing bars
const AudioWaveform: React.FC = () => {
  return (
    <div className="audio-waveform-container" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '3px',
      padding: '8px 12px 2px 12px',
      borderTop: '1px solid rgba(255, 255, 255, 0.03)',
      marginTop: '6px',
      height: '24px'
    }}>
      <span style={{ fontSize: '0.68rem', color: 'var(--accent-secondary)', fontWeight: 700, marginRight: '8px', letterSpacing: '1px' }}>
        COGNITIVE VOICE STREAMING:
      </span>
      <div className="waveform-bar bar-1"></div>
      <div className="waveform-bar bar-2"></div>
      <div className="waveform-bar bar-3"></div>
      <div className="waveform-bar bar-4"></div>
      <div className="waveform-bar bar-5"></div>
      <div className="waveform-bar bar-6"></div>
      <div className="waveform-bar bar-7"></div>
      <div className="waveform-bar bar-8"></div>
      <div className="waveform-bar bar-9"></div>
      <div className="waveform-bar bar-10"></div>
    </div>
  );
};

// Safe Code Sandbox Runner component for browser-side script execution
interface CodeSandboxRunnerProps {
  code: string;
  language: string;
}

const CodeSandboxRunner: React.FC<CodeSandboxRunnerProps> = ({ code, language }) => {
  const isRunnable = ['javascript', 'js', 'python', 'py'].includes(language.toLowerCase());
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  if (!isRunnable) return null;

  const handleRun = () => {
    setIsRunning(true);
    setIsError(false);
    setOutput(null);

    setTimeout(() => {
      const lang = language.toLowerCase();
      if (lang === 'javascript' || lang === 'js') {
        const logs: string[] = [];
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        console.warn = (...args) => {
          logs.push('⚠️ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };
        console.error = (...args) => {
          logs.push('❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        };

        try {
          const runner = new Function(code);
          runner();
          setOutput(logs.join('\n') || 'Success: Code executed successfully with no output logs.');
          setIsError(false);
        } catch (err: any) {
          setOutput(`❌ Error: ${err.message}`);
          setIsError(true);
        } finally {
          console.log = originalLog;
          console.warn = originalWarn;
          console.error = originalError;
          setIsRunning(false);
        }
      } else if (lang === 'python' || lang === 'py') {
        try {
          const lines = code.split('\n');
          const logs: string[] = [];
          let hasOutput = false;
          
          for (let line of lines) {
            line = line.trim();
            if (line.startsWith('print(') && line.endsWith(')')) {
              const inner = line.substring(6, line.length - 1).trim();
              if ((inner.startsWith('"') && inner.endsWith('"')) || (inner.startsWith("'") && inner.endsWith("'"))) {
                logs.push(inner.substring(1, inner.length - 1));
                hasOutput = true;
              } else {
                try {
                  const result = new Function(`return (${inner});`)();
                  logs.push(String(result));
                  hasOutput = true;
                } catch {
                  logs.push(`[Simulated Print]: ${inner}`);
                  hasOutput = true;
                }
              }
            }
          }
          if (!hasOutput) {
            logs.push('Python Sandbox Simulation active.\n(Add print() statements to view direct terminal output).');
          }
          setOutput(logs.join('\n'));
          setIsError(false);
        } catch (err: any) {
          setOutput(`❌ Python Simulation Error: ${err.message}`);
          setIsError(true);
        } finally {
          setIsRunning(false);
        }
      }
    }, 500);
  };

  return (
    <div className="sandbox-runner-panel" style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      backgroundColor: 'rgba(5, 8, 17, 0.5)',
      padding: '10px 12px',
      borderBottomLeftRadius: 'var(--border-radius-md)',
      borderBottomRightRadius: 'var(--border-radius-md)',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      <div className="sandbox-runner-controls" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#00ffcc', boxShadow: '0 0 6px #00ffcc' }}></span>
          {language.toUpperCase()} Sandbox Ready
        </span>
        <button
          onClick={handleRun}
          disabled={isRunning}
          style={{
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)',
            border: 'none',
            borderRadius: '4px',
            color: '#ffffff',
            padding: '4px 12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 0 10px rgba(0, 217, 255, 0.15)',
            transition: 'all 0.2s ease',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? (
            <>
              <div className="sandbox-spinner" style={{
                width: '10px',
                height: '10px',
                border: '2px solid #ffffff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }}></div>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Run Code</span>
            </>
          )}
        </button>
      </div>

      {output !== null && (
        <div className="sandbox-runner-console" style={{
          backgroundColor: '#03050a',
          border: '1px solid rgba(0, 217, 255, 0.15)',
          borderRadius: '4px',
          padding: '8px 10px',
          fontFamily: 'monospace',
          fontSize: '0.78rem',
          color: isError ? '#f87171' : '#00ffcc',
          whiteSpace: 'pre-wrap',
          maxHeight: '150px',
          overflowY: 'auto',
          boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.8)',
          textAlign: 'left'
        }}>
          {output}
        </div>
      )}
    </div>
  );
};

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
    regenerateLastResponse,
    selectedPersonalityId
  } = useChat();

  const [showExportOptions, setShowExportOptions] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const voiceDropdownRef = useRef<HTMLDivElement>(null);

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

    // Clean up code blocks, markdown characters, and html markup for speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/<[^>]*>/g, '') // Remove HTML
      .replace(/\*/g, '') // Remove all asterisks to prevent reading "asterisk"
      .replace(/_/g, '') // Remove all underscores
      .replace(/`/g, '') // Remove all backticks
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    } else {
      const isIndonesian = /[aeiou]nd[ao]|dan|yang|untuk|dengan|adalah|bisa|saya|kamu/i.test(cleanText);
      utterance.lang = isIndonesian ? 'id-ID' : 'en-US';
    }
 
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

  // Handle downloading, copying, and sharing videos
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

  // Close dropdown on clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowExportOptions(false);
      }
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(e.target as Node)) {
        setShowVoiceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Load available speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const savedVoice = localStorage.getItem('garionx_speech_voice');
      if (savedVoice) {
        setSelectedVoiceName(savedVoice);
      } else {
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('id') || v.lang.startsWith('en'))?.name || '';
        setSelectedVoiceName(defaultVoice);
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
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

  // Handle Export to PDF (Cyber Dossier layout)
  const handleExportPDF = () => {
    if (!activeChat || messages.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to export PDF dossiers.');
      return;
    }

    const safeTitle = activeChat.title;
    const modelName = activeChat.model || 'openai';
    const agentName = currentPersonality?.name ?? 'GarionX Core';
    const dateStr = new Date(activeChat.createdAt).toLocaleDateString();

    let htmlContent = `
      <html>
        <head>
          <title>GarionX Cyber Dossier - ${safeTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
            body {
              background-color: #03050a;
              color: #00ffcc;
              font-family: 'Courier Prime', monospace;
              padding: 40px;
              margin: 0;
            }
            .dossier-header {
              border: 2px double #00ffcc;
              padding: 20px;
              margin-bottom: 30px;
              background-color: rgba(0, 255, 204, 0.02);
              position: relative;
              overflow: hidden;
            }
            .dossier-header::before {
              content: 'CLASSIFIED PROTOCOL';
              position: absolute;
              top: -1px;
              right: 15px;
              background-color: #00ffcc;
              color: #03050a;
              font-size: 0.65rem;
              font-weight: bold;
              padding: 2px 6px;
              letter-spacing: 2px;
            }
            .title {
              font-size: 1.8rem;
              font-weight: bold;
              margin: 0 0 10px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-shadow: 0 0 10px rgba(0, 255, 204, 0.5);
            }
            .metadata {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 8px 20px;
              font-size: 0.85rem;
              color: rgba(0, 255, 204, 0.7);
              margin-top: 15px;
              border-top: 1px dashed rgba(0, 255, 204, 0.3);
              padding-top: 15px;
            }
            .message-item {
              margin-bottom: 25px;
              border-bottom: 1px solid rgba(0, 255, 204, 0.1);
              padding-bottom: 20px;
            }
            .sender {
              font-weight: bold;
              text-transform: uppercase;
              font-size: 0.9rem;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .sender-user {
              color: #0088ff;
              text-shadow: 0 0 8px rgba(0, 136, 255, 0.4);
            }
            .sender-bot {
              color: #ff007f;
              text-shadow: 0 0 8px rgba(255, 0, 127, 0.4);
            }
            .content {
              font-size: 0.95rem;
              line-height: 1.6;
              white-space: pre-wrap;
              color: #e2e8f0;
            }
            pre {
              background-color: #070a13;
              border: 1px solid rgba(0, 255, 204, 0.3);
              padding: 12px;
              border-radius: 4px;
              overflow-x: auto;
              color: #00ffcc;
            }
            code {
              font-family: monospace;
            }
            @media print {
              body {
                background-color: #ffffff;
                color: #000000;
              }
              .dossier-header {
                border-color: #000000;
                background-color: transparent;
              }
              .dossier-header::before {
                background-color: #000000;
                color: #ffffff;
              }
              .title {
                text-shadow: none;
              }
              .sender-user { color: #0000ff; text-shadow: none; }
              .sender-bot { color: #d00000; text-shadow: none; }
              .content { color: #000000; }
              pre {
                border-color: #000000;
                background-color: #f1f5f9;
                color: #000000;
              }
            }
          </style>
        </head>
        <body>
          <div class="dossier-header">
            <h1 class="title">${safeTitle}</h1>
            <div class="metadata">
              <div><strong>DOSSIER ID:</strong> G-X-${activeChat.id.substring(0, 8).toUpperCase()}</div>
              <div><strong>DATE STAMP:</strong> ${dateStr}</div>
              <div><strong>COORDINATOR:</strong> ${agentName}</div>
              <div><strong>SYSTEM PORT:</strong> ${modelName.toUpperCase()}</div>
            </div>
          </div>
          <div class="dossier-body">
    `;

    messages.forEach((msg) => {
      const isUser = msg.sender === 'user';
      const senderClass = isUser ? 'sender-user' : 'sender-bot';
      const senderLabel = isUser ? '▲ AGENT (USER)' : `▼ COGNITIVE SYSTEM (${agentName})`;

      htmlContent += `
        <div class="message-item">
          <div class="sender ${senderClass}">${senderLabel}</div>
          <div class="content">${msg.content}</div>
        </div>
      `;
    });

    htmlContent += `
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setShowExportOptions(false);
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

  // Helper to parse images (![alt](url)), links ([text](url)), bold (**text**), italics (*text*), and inline code (`code`)
  const parseMarkdownText = (text: string) => {
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Parse images: ![alt](url)
    escaped = escaped.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="chat-image" />');
    // Parse links: [text](url)
    escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>');
    // Parse bold (**text**)
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Parse italics (*text*)
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Parse inline code (`code`)
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="markdown-inline-code">$1</code>');
    
    return <span dangerouslySetInnerHTML={{ __html: escaped }} />;
  };

  // Helper to parse markdown blocks (headings, lists, blockquotes, tables, paragraphs)
  const parseTextWithTables = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const flushTable = (rows: string[][], key: number) => {
      if (rows.length === 0) return null;
      
      const headers = rows[0];
      const hasDivider = rows.length > 1 && rows[1].every(cell => cell.trim().startsWith('-') || cell.trim() === '');
      const dataRows = hasDivider ? rows.slice(2) : rows.slice(1);

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

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // 1. Table parsing
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableRows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          const cells = lines[i].trim().split('|').slice(1, -1);
          tableRows.push(cells);
          i++;
        }
        elements.push(flushTable(tableRows, i));
        continue;
      }

      // 2. Unordered List parsing
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const listItems: string[] = [];
        while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
          listItems.push(lines[i].trim().substring(2));
          i++;
        }
        elements.push(
          <ul key={`ul-${i}`} className="markdown-ul">
            {listItems.map((item, idx) => (
              <li key={idx} className="markdown-li">{parseMarkdownText(item)}</li>
            ))}
          </ul>
        );
        continue;
      }

      // 3. Ordered List parsing
      if (/^\d+\.\s/.test(trimmed)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          const itemTrimmed = lines[i].trim();
          const dotIndex = itemTrimmed.indexOf('.');
          listItems.push(itemTrimmed.substring(dotIndex + 1).trim());
          i++;
        }
        elements.push(
          <ol key={`ol-${i}`} className="markdown-ol">
            {listItems.map((item, idx) => (
              <li key={idx} className="markdown-li">{parseMarkdownText(item)}</li>
            ))}
          </ol>
        );
        continue;
      }

      // 4. Blockquote parsing
      if (trimmed.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          const quoteLine = lines[i].trim();
          const cleanQuote = quoteLine.replace(/^>\s*/, '');
          quoteLines.push(cleanQuote);
          i++;
        }
        elements.push(
          <blockquote key={`quote-${i}`} className="markdown-blockquote">
            {quoteLines.map((ql, idx) => (
              <p key={idx} className="paragraph-line">{parseMarkdownText(ql)}</p>
            ))}
          </blockquote>
        );
        continue;
      }

      // 5. Headings
      if (trimmed.startsWith('# ')) {
        elements.push(<h1 key={`h1-${i}`}>{parseMarkdownText(trimmed.substring(2))}</h1>);
        i++;
        continue;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i}`}>{parseMarkdownText(trimmed.substring(3))}</h2>);
        i++;
        continue;
      }
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`}>{parseMarkdownText(trimmed.substring(4))}</h3>);
        i++;
        continue;
      }
      if (trimmed.startsWith('#### ')) {
        elements.push(<h4 key={`h4-${i}`}>{parseMarkdownText(trimmed.substring(5))}</h4>);
        i++;
        continue;
      }

      // 6. Horizontal Rule
      if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
        elements.push(<hr key={`hr-${i}`} className="markdown-hr" />);
        i++;
        continue;
      }

      // 7. Regular paragraph or Line break
      if (trimmed === '') {
        elements.push(<br key={`br-${i}`} />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="paragraph-line">
            {parseMarkdownText(line)}
          </p>
        );
      }
      i++;
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

      if (language.toLowerCase() === 'mermaid') {
        parts.push(
          <div key={match.index} className="mermaid-diagram-container" style={{ margin: '14px 0', width: '100%' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginBottom: '6px',
              fontWeight: 600
            }}>
              <span>📊 Interactive Cyber Flowchart</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.7rem'
                }}
              >
                Copy Source
              </button>
            </div>
            <MermaidVisualizer chart={code} />
          </div>
        );
      } else {
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
            <CodeSandboxRunner code={code} language={language} />
          </div>
        );
      }

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

            {/* Voice selection dropdown */}
            <div className="header-voice-container" ref={voiceDropdownRef} style={{ position: 'relative' }}>
              <button
                className="voice-trigger-btn animate-glow"
                onClick={() => setShowVoiceDropdown(!showVoiceDropdown)}
                title="Select AI Speech Voice"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(30, 30, 46, 0.4)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '6px 12px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                <span>Voice</span>
              </button>
              {showVoiceDropdown && (
                <div className="voice-dropdown glass-panel" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '8px',
                  width: '240px',
                  zIndex: 100,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '4px' }}>
                    SELECT AI VOICE
                  </div>
                  {voices.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px', textAlign: 'center' }}>No voices detected</div>
                  ) : (
                    voices.map((v) => (
                      <button
                        key={v.name}
                        onClick={() => {
                          setSelectedVoiceName(v.name);
                          localStorage.setItem('garionx_speech_voice', v.name);
                          setShowVoiceDropdown(false);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: selectedVoiceName === v.name ? '#00ffcc' : 'var(--text-secondary)',
                          padding: '6px 8px',
                          textAlign: 'left',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          backgroundColor: selectedVoiceName === v.name ? 'rgba(0, 255, 204, 0.05)' : 'transparent',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{v.name}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>Lang: {v.lang}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
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
                  <button onClick={handleExportPDF}>
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
                              const videoUrl = msg.attachmentUrl.startsWith('http') ? msg.attachmentUrl : `${BASE_URL}${msg.attachmentUrl}`;
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
                    {speakingMessageId === msg.id && (
                      <AudioWaveform />
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
                <div className="bot-avatar-wrapper">
                  <div className="bot-avatar-label">
                    {currentPersonality ? currentPersonality.name[0] : 'G'}
                  </div>
                </div>
                <div className="message-bubble bot-bubble">
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
                <div className="bot-avatar-wrapper">
                  <div className="bot-avatar-label">
                    {currentPersonality ? currentPersonality.name[0] : 'G'}
                  </div>
                </div>
                <div className="message-bubble bot-bubble typing-indicator-bubble">
                  <div className="typing-indicator-wrapper">
                    <div className="typing-indicator">
                      <span className="dot animate-dot-1"></span>
                      <span className="dot animate-dot-2"></span>
                      <span className="dot animate-dot-3"></span>
                    </div>
                    <span className="loading-status-text">
                      {((activeChat?.personalityId === 'video_generator') || (selectedPersonalityId === 'video_generator'))
                        ? "Sedang membuat animasi..."
                        : "Sedang berpikir..."}
                    </span>
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
