import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/chat-context';
import { BASE_URL } from '../../../data/datasources/chat-api-datasource';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, uploadAvatar, getProfile } = useChat();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTheme, setActiveTheme] = useState<'dark' | 'amoled' | 'cyberpunk' | 'light'>('dark');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync theme selection on open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('garionx_theme') as any;
      if (saved) {
        setActiveTheme(saved);
      }
    }
  }, [isOpen]);

  const handleThemeChange = (theme: 'dark' | 'amoled' | 'cyberpunk' | 'light') => {
    setActiveTheme(theme);
    if (typeof window === 'undefined') return;
    localStorage.setItem('garionx_theme', theme);
    document.documentElement.classList.remove('theme-amoled', 'theme-cyberpunk', 'theme-light');
    if (theme !== 'dark') {
      document.documentElement.classList.add('theme-' + theme);
    }
  };

  // Fetch fresh profile from API when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      setProfileLoading(true);
      getProfile().finally(() => setProfileLoading(false));
    }
  }, [isOpen]);

  // Sync form state whenever user data updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setAvatarLoading(true);
    setMessage(null);
    
    try {
      await uploadAvatar(file);
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload avatar.' });
    } finally {
      setAvatarLoading(false);
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      await updateProfile(name, email);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const avatarUrl = user.avatarUrl 
    ? (user.avatarUrl.startsWith('/') ? `${BASE_URL}${user.avatarUrl}` : user.avatarUrl)
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.username)}`;

  const isDisabled = loading || avatarLoading || profileLoading;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="profile-modal-close-btn" onClick={onClose} title="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="profile-modal-header">
          <h2>Cybernetic Profile Settings</h2>
          <p>Manage your user identity and session credentials</p>
        </div>

        {message && (
          <div className={`profile-message-banner ${message.type}`}>
            {message.type === 'success' ? '✓ ' : '⚠ '}{message.text}
          </div>
        )}

        {profileLoading ? (
          <div className="profile-loading-state">
            <div className="avatar-spinner"></div>
            <span>Fetching latest profile data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Avatar Area */}
            <div className="avatar-section">
              <div className="avatar-preview-container" onClick={handleAvatarClick} title="Change Avatar">
                <img src={avatarUrl} alt="User Avatar" className="avatar-preview-img" />
                {avatarLoading ? (
                  <div className="avatar-overlayloading">
                    <div className="avatar-spinner"></div>
                  </div>
                ) : (
                  <div className="avatar-hover-overlay">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    <span>Upload</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
              />
              <span className="avatar-hint">Click avatar to upload a new image (JPG, PNG, WEBP, GIF)</span>
            </div>

            {/* Theme Selector */}
            <div className="profile-divider">
              <span>System Theme Settings</span>
            </div>
            <div className="theme-selector-section">
              <div className="theme-options-grid">
                <button
                  type="button"
                  className={`theme-option-btn theme-dark ${activeTheme === 'dark' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                  title="Sleek Cyber Dark Mode"
                >
                  <span className="theme-color-preview preview-dark"></span>
                  <span className="theme-name-text">Sleek Dark</span>
                </button>
                <button
                  type="button"
                  className={`theme-option-btn theme-amoled ${activeTheme === 'amoled' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('amoled')}
                  title="AMOLED Jet Black"
                >
                  <span className="theme-color-preview preview-amoled"></span>
                  <span className="theme-name-text">Amoled Black</span>
                </button>
                <button
                  type="button"
                  className={`theme-option-btn theme-cyberpunk ${activeTheme === 'cyberpunk' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('cyberpunk')}
                  title="Cyberpunk Green/Pink"
                >
                  <span className="theme-color-preview preview-cyberpunk"></span>
                  <span className="theme-name-text">Cyberpunk</span>
                </button>
                <button
                  type="button"
                  className={`theme-option-btn theme-light ${activeTheme === 'light' ? 'active' : ''}`}
                  onClick={() => handleThemeChange('light')}
                  title="Clean Light Mode"
                >
                  <span className="theme-color-preview preview-light"></span>
                  <span className="theme-name-text">Clean Light</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="profile-divider">
              <span>Profile Information</span>
            </div>

            {/* Form Fields */}
            <div className="form-group">
              <label htmlFor="profile-username">Username</label>
              <input
                type="text"
                id="profile-username"
                value={user.username}
                disabled
                className="disabled-input"
              />
              <span className="field-hint">Username is immutable for session security</span>
            </div>

            <div className="form-group">
              <label htmlFor="profile-name">Full Name</label>
              <input
                type="text"
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. User Gabut"
                required
                disabled={isDisabled}
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-email">Email Address</label>
              <input
                type="email"
                id="profile-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user.gabut@gmail.com"
                required
                disabled={isDisabled}
              />
            </div>

            <button type="submit" className="submit-profile-btn glow-effect" disabled={isDisabled}>
              {loading ? (
                <div className="profile-spinner"></div>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
