import React, { useState } from 'react';
import { useChat } from '../../context/chat-context';
import './AgentModal.css';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose }) => {
  const { createPersonality, user, setAuthModalOpen } = useChat();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please log in first to create custom agents.');
      setAuthModalOpen(true);
      return;
    }

    if (!name.trim()) {
      setError('Agent Name is required.');
      return;
    }
    if (!systemPrompt.trim()) {
      setError('System Instruction (Prompt) is required.');
      return;
    }

    try {
      setSubmitting(true);
      await createPersonality(name, description, systemPrompt);
      
      // Reset form and close
      setName('');
      setDescription('');
      setSystemPrompt('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create custom agent.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="agent-modal-overlay" onClick={onClose}>
      <div className="agent-modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="agent-modal-header">
          <h3>Create Custom AI Agent</h3>
          <button className="agent-modal-close" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="agent-modal-form">
          {error && <div className="agent-form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="agent-name">Agent Name</label>
            <input
              id="agent-name"
              type="text"
              placeholder="e.g. CyberDoc, CodeReviewer..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-description">Short Description</label>
            <input
              id="agent-description"
              type="text"
              placeholder="e.g. A health specialist with an attitude..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              maxLength={150}
            />
          </div>

          <div className="form-group">
            <label htmlFor="agent-prompt">System Instruction (Prompt)</label>
            <textarea
              id="agent-prompt"
              rows={5}
              placeholder="e.g. You are a medical expert assistant. Speak using professional advice mixed with simple terms..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              disabled={submitting}
              required
            />
            <span className="field-hint">
              This prompt instructs the AI how to behave, its personality, and tone.
            </span>
          </div>

          <div className="agent-modal-actions">
            <button
              type="button"
              className="agent-cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="agent-submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
