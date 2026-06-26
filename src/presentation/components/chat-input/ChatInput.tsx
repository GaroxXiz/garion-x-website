import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/chat-context';
import './ChatInput.css';

export const ChatInput: React.FC = () => {
  const {
    sendMessage,
    loading,
    personalities,
    selectedPersonalityId,
    setSelectedPersonalityId,
    selectedModelId,
    setSelectedModelId,
    activeChat,
    streamingMessageId,
    setAgentModalOpen,
    cancelStreaming,
    uploadFile
  } = useChat();

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'id-ID'; // Optimized for Indonesian as requested, works with English too

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadFile(file);
      setAttachmentUrl(result.url);
      setAttachmentType(result.type);
      setAttachmentName(file.name);
    } catch (err: any) {
      alert(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (!file) continue;

        // Prevent default paste behavior for images (like pasting filename string)
        e.preventDefault();

        setUploading(true);
        try {
          const result = await uploadFile(file);
          setAttachmentUrl(result.url);
          setAttachmentType(result.type);
          setAttachmentName(file.name || `pasted_image_${Date.now()}.png`);
        } catch (err: any) {
          alert(err.message || 'Failed to upload pasted image');
        } finally {
          setUploading(false);
        }
        break; // Handled the pasted image
      }
    }
  };

  const handleRemoveAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentType(null);
    setAttachmentName(null);
  };

  // Auto-resize textarea heights
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachmentUrl) || loading || streamingMessageId || uploading) return;

    // Stop listening if sending message
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const msg = input;
    const attUrl = attachmentUrl || undefined;
    const attType = attachmentType || undefined;

    setInput('');
    handleRemoveAttachment();

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    await sendMessage(msg, attUrl, attType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isButtonsDisabled = loading || !!streamingMessageId || uploading || (!input.trim() && !attachmentUrl);

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        style={{ display: 'none' }}
      />

      {/* Attachment Preview Badge Overlay */}
      {attachmentUrl && (
        <div className="attachment-preview-badge glass-panel">
          <span className="attachment-preview-icon">
            {attachmentType === 'video' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00d9ff" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            )}
          </span>
          <span className="attachment-preview-name">{attachmentName}</span>
          <button type="button" className="attachment-preview-remove" onClick={handleRemoveAttachment} title="Remove File">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      <div className="input-bar-container glass-panel">
        
        {/* Personality Dropdown with Custom Add Button wrapper */}
        <div className="personality-selector-wrapper">
          <div className="personality-selector">
            <select
              value={selectedPersonalityId}
              onChange={(e) => setSelectedPersonalityId(e.target.value)}
              disabled={loading || !!streamingMessageId || !!activeChat} // Lock personality if inside a chat
              className="personality-select"
              title={activeChat ? "Personality is locked during active chat session" : "Select AI Personality"}
            >
              {personalities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.split(' ')[0]} {/* Shorten name for space */}
                </option>
              ))}
            </select>
            <span className="dropdown-arrow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setAgentModalOpen(true)}
            disabled={loading || !!streamingMessageId || !!activeChat}
            className="add-agent-btn"
            title="Create Custom Agent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        {/* Model Dropdown */}
        <div className="model-selector">
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            disabled={loading || !!streamingMessageId} // Can switch model mid-conversation
            className="model-select"
            title="Select AI Model"
          >
            <option value="openai">OpenAI (Mini)</option>
            <option value="gemini">Gemini (Flash)</option>
            <option value="claude">Claude (Sonnet)</option>
          </select>
          <span className="dropdown-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </span>
        </div>

        {/* Upload Button Trigger */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || !!streamingMessageId || uploading}
          className={`upload-attachment-btn ${uploading ? 'uploading' : ''}`}
          title="Attach Image or Video"
        >
          {uploading ? (
            <div className="upload-spinner-small" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          )}
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={isListening ? "Listening... Speak now..." : "Type your message..."}
          rows={1}
          disabled={loading || !!streamingMessageId}
          className={`chat-textarea ${isListening ? 'listening-placeholder' : ''}`}
        />

        {/* Voice dictation Speech-to-Text Button */}
        <button
          type="button"
          onClick={toggleListening}
          disabled={loading || !!streamingMessageId}
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          title={isListening ? "Listening... Click to stop" : "Dictate message (Speech-to-Text)"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isListening ? "pulse-mic-icon" : ""}>
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        </button>

        {/* Send Button / Stop Button */}
        {loading || !!streamingMessageId ? (
          <button
            type="button"
            onClick={cancelStreaming}
            className="send-btn stop-btn ready"
            title="Stop AI Generation"
            style={{ backgroundColor: '#ef4444', borderColor: '#ef4444', color: '#ffffff', cursor: 'pointer', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isButtonsDisabled}
            className={`send-btn ${!isButtonsDisabled ? 'ready' : ''}`}
            title="Send Message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        )}
      </div>
      <div className="terms-hint">
        GarionX can make mistakes. Please check important details.
      </div>
    </form>
  );
};
