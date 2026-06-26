import React from 'react';
import { useChat } from '../../context/chat-context';
import { Logo } from '../logo/Logo';
import './WelcomeState.css';

export const WelcomeState: React.FC = () => {
  const { personalities, selectedPersonalityId, setSelectedPersonalityId } = useChat();

  return (
    <div className="welcome-container animate-fade-in">
      <div className="welcome-hero">
        <Logo size="lg" />
        <h1 className="welcome-title">GarionX AI</h1>
        <p className="welcome-subtitle">
          Next-generation analytical engine. Select a digital interface below to initialize core routines.
        </p>
      </div>

      <div className="personality-grid">
        {personalities.map((p) => {
          const isSelected = selectedPersonalityId === p.id;
          return (
            <div
              key={p.id}
              className={`personality-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedPersonalityId(p.id)}
            >
              <div className="card-header-icon">
                {p.id === 'garionx' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-blue">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    <path d="M2 12h20"></path>
                  </svg>
                )}
                {p.id === 'helpful' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-green">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )}
                {p.id === 'coder' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-cyan">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                  </svg>
                )}
                {p.id === 'creative' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-purple">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                )}
                {p.id === 'image_generator' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-pink">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                )}
                {p.id === 'video_summarizer' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-amber">
                    <path d="M23 7l-7 5 7 5V7z"></path>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                  </svg>
                )}
                {p.id !== 'garionx' && p.id !== 'helpful' && p.id !== 'coder' && p.id !== 'creative' && p.id !== 'image_generator' && p.id !== 'video_summarizer' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="icon-blue">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                )}
              </div>
              <h3 className="personality-name">{p.name}</h3>
              <p className="personality-desc">{p.description}</p>
              <div className="selection-indicator">
                <span className="dot"></span>
                <span>{isSelected ? 'Active Model' : 'Select'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
