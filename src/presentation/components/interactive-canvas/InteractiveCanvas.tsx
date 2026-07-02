import React, { useState, useEffect } from 'react';
import './InteractiveCanvas.css';

interface InteractiveCanvasProps {
  code: string | null;
  language: string;
  onClose: () => void;
}

export const InteractiveCanvas: React.FC<InteractiveCanvasProps> = ({ code, language, onClose }) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [srcDoc, setSrcDoc] = useState<string>('');

  useEffect(() => {
    if (!code) {
      setSrcDoc('');
      return;
    }

    // Check if code is a complete HTML page
    const isFullHtml = code.toLowerCase().includes('<html') || code.toLowerCase().includes('<!doctype html>');
    
    if (isFullHtml) {
      setSrcDoc(code);
    } else {
      // Wrap snippet inside standard HTML structure
      setSrcDoc(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #f1f5f9;
                background-color: #0b0f19;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                box-sizing: border-box;
              }
              /* Center SVGs nicely */
              svg {
                max-width: 100%;
                height: auto;
              }
            </style>
          </head>
          <body>
            ${code}
          </body>
        </html>
      `);
    }
  }, [code]);

  if (!code) return null;

  return (
    <div className="interactive-canvas-container glass-panel">
      {/* Canvas Header */}
      <div className="canvas-header">
        <div className="canvas-meta">
          <div className="canvas-glow-dot" />
          <span className="canvas-title">Interactive Canvas ({language.toUpperCase()})</span>
        </div>
        
        {/* Tab Selector */}
        <div className="canvas-tabs">
          <button
            className={`canvas-tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            Preview
          </button>
          <button
            className={`canvas-tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>

        {/* Action Group */}
        <div className="canvas-actions">
          <button
            className="canvas-action-btn copy"
            onClick={() => navigator.clipboard.writeText(code)}
            title="Copy Code"
          >
            Copy
          </button>
          <button
            className="canvas-action-btn close"
            onClick={onClose}
            title="Close Canvas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Canvas Workspace */}
      <div className="canvas-workspace-area">
        {activeTab === 'preview' ? (
          <iframe
            title="Interactive Canvas Sandbox"
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="canvas-iframe"
          />
        ) : (
          <div className="canvas-code-wrapper">
            <pre className="canvas-code-pre">
              <code>{code}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
