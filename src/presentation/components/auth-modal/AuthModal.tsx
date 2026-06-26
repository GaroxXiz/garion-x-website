import React, { useState } from 'react';
import { useChat } from '../../context/chat-context';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, register } = useChat();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setErrorMsg(null);
    setUsername('');
    setPassword('');
    setEmail('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingState(true);

    try {
      if (isLoginTab) {
        await login(username, password);
      } else {
        await register(username, password, email, name);
      }
      handleClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Tab Headers */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg(null);
            }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${!isLoginTab ? 'active' : ''}`}
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg(null);
            }}
          >
            Register
          </button>
        </div>

        {/* Brand Banner */}
        <div className="modal-brand">
          <h2>GarionX Terminal</h2>
          <p>{isLoginTab ? 'Enter credentials to authorize session' : 'Create new cybernetic profile credentials'}</p>
        </div>

        {/* Error Message */}
        {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="username">{isLoginTab ? 'Email Address' : 'Username'}</label>
            <input
              type={isLoginTab ? 'email' : 'text'}
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={isLoginTab ? 'e.g. user.gabut@gmail.com' : 'e.g. user_gabut'}
              required
              disabled={loadingState}
            />
          </div>

          {!isLoginTab && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. User Gabut"
                  required
                  disabled={loadingState}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user.gabut@gmail.com"
                  required
                  disabled={loadingState}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loadingState}
            />
          </div>

          <button type="submit" className="submit-auth-btn glow-effect" disabled={loadingState}>
            {loadingState ? (
              <div className="auth-spinner"></div>
            ) : (
              <span>{isLoginTab ? 'Sign In Session' : 'Create Profile'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
