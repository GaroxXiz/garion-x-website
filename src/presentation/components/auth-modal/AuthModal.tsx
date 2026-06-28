import React, { useState } from 'react';
import { useChat } from '../../context/chat-context';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, sendOtp, verifyOtp } = useChat();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const [loadingState, setLoadingState] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setAuthModalOpen(false);
    setErrorMsg(null);
    setEmail('');
    setName('');
    setOtp('');
    setIsOtpSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingState(true);

    try {
      if (!isOtpSent) {
        // Stage 1: Send OTP to Email
        const res = await sendOtp(email);
        setIsOtpSent(true);
        // Show alert containing mock OTP for testing
        if (res && res.otp) {
          alert(`[MOCK EMAIL SERVICE] OTP Code sent: ${res.otp}`);
        }
      } else {
        // Stage 2: Verify OTP
        await verifyOtp(email, otp);
        handleClose();
      }
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
        {!isOtpSent && (
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
        )}

        {/* Brand Banner */}
        <div className="modal-brand">
          <h2>GarionX Terminal</h2>
          <p>
            {isOtpSent 
              ? 'Enter security authorization code' 
              : (isLoginTab ? 'Request OTP code to authorize session' : 'Register a new profile via Email OTP')}
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {!isOtpSent ? (
            <>
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

              {!isLoginTab && (
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
              )}
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="otp">Enter 6-Digit OTP Code</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="••••••"
                    required
                    disabled={loadingState}
                    style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Sent to: <strong>{email}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOtpSent(false);
                        setOtp('');
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="submit-auth-btn glow-effect" disabled={loadingState}>
            {loadingState ? (
              <div className="auth-spinner"></div>
            ) : (
              <span>
                {!isOtpSent ? 'Send OTP Code' : 'Verify & Sign In'}
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
