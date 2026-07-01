import React, { useState } from 'react';
import { useChat } from '../../context/chat-context';
import './AuthModal.css';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setAuthModalOpen, login, sendOtp, verifyOtp, forgotPassword, resetPassword } = useChat();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
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
    setPassword('');
    setOtp('');
    setIsOtpSent(false);
    setIsForgotPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingState(true);

    try {
      if (isForgotPassword) {
        if (!isOtpSent) {
          // Stage 1 (Forgot Password): Request Reset OTP
          const res = await forgotPassword(email);
          setIsOtpSent(true);
          if (res && res.otp && res.isMock) {
            alert("[DEV SIMULATION] SMTP_USER & SMTP_PASS belum dikonfigurasi di backend.\n\nSilakan periksa LOG TERMINAL backend Anda untuk mengambil kode reset OTP.");
          } else {
            alert(`Kode reset OTP telah berhasil dikirim ke email Gmail Anda: ${email}`);
          }
        } else {
          // Stage 2 (Forgot Password): Submit Reset OTP and New Password
          await resetPassword(email, otp, password);
          alert("Kata sandi Anda berhasil diset ulang! Silakan masuk kembali menggunakan kata sandi baru.");
          setIsForgotPassword(false);
          setIsOtpSent(false);
          setIsLoginTab(true);
          setPassword('');
          setOtp('');
        }
      } else {
        if (!isOtpSent) {
          if (isLoginTab) {
            // Stage 1 (Login): Verify Email + Password, request OTP
            const res = await login(email, password);
            setIsOtpSent(true);
            if (res && res.otp && res.isMock) {
              alert("[DEV SIMULATION] SMTP_USER & SMTP_PASS belum dikonfigurasi di backend.\n\nSilakan periksa LOG TERMINAL backend Anda untuk mengambil kode OTP.");
            } else {
              alert(`Kode OTP keamanan telah berhasil dikirim ke email Gmail Anda: ${email}`);
            }
          } else {
            // Stage 1 (Register): Request OTP to Email
            const res = await sendOtp(email);
            setIsOtpSent(true);
            if (res && res.otp && res.isMock) {
              alert("[DEV SIMULATION] SMTP_USER & SMTP_PASS belum dikonfigurasi di backend.\n\nSilakan periksa LOG TERMINAL backend Anda untuk mengambil kode OTP.");
            } else {
              alert(`Kode OTP keamanan telah berhasil dikirim ke email Gmail Anda: ${email}`);
            }
          }
        } else {
          // Stage 2: Verify OTP
          if (isLoginTab) {
            await verifyOtp(email, otp);
          } else {
            await verifyOtp(email, otp, name, password);
          }
          handleClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoadingState(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg(null);
    setLoadingState(true);
    try {
      let res;
      if (isForgotPassword) {
        res = await forgotPassword(email);
      } else if (isLoginTab) {
        res = await login(email, password);
      } else {
        res = await sendOtp(email);
      }
      setOtp('');
      if (res && res.otp && res.isMock) {
        alert("[DEV SIMULATION] SMTP_USER & SMTP_PASS belum dikonfigurasi di backend.\n\nSilakan periksa LOG TERMINAL backend Anda untuk mengambil kode OTP.");
      } else {
        alert(`Kode OTP baru telah berhasil dikirim ke email Gmail Anda: ${email}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP code.');
    } finally {
      setLoadingState(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close Modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Tab Headers */}
        {!isOtpSent && !isForgotPassword && (
          <div className="modal-tabs">
            <button
              type="button"
              className={`tab-btn ${isLoginTab ? 'active' : ''}`}
              onClick={() => {
                setIsLoginTab(true);
                setErrorMsg(null);
                setPassword('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`tab-btn ${!isLoginTab ? 'active' : ''}`}
              onClick={() => {
                setIsLoginTab(false);
                setErrorMsg(null);
                setPassword('');
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
            {isForgotPassword
              ? (isOtpSent ? 'Verify code and set your new password' : 'Reset your account password via Email OTP')
              : (isOtpSent 
                  ? 'Enter security authorization code' 
                  : (isLoginTab ? 'Enter your credentials to receive an OTP' : 'Create a new profile with password and OTP'))
            }
          </p>
        </div>

        {/* Error Message */}
        {errorMsg && <div className="modal-error-banner">{errorMsg}</div>}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="modal-form">
          {isForgotPassword ? (
            // Forgot Password Flow
            !isOtpSent ? (
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
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="otp">Enter Reset OTP Code</label>
                  <div className="otp-input-container">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      placeholder="••••••"
                      required
                      disabled={loadingState}
                      className="otp-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password">New Password</label>
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

                <div className="otp-info-footer" style={{ marginTop: '-8px' }}>
                  <span className="sent-to-text">Sent to: <strong>{email}</strong></span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="otp-action-link resend"
                    disabled={loadingState}
                  >
                    Resend OTP
                  </button>
                </div>
              </>
            )
          ) : (
            // Normal Login / Register Flow
            !isOtpSent ? (
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

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="password">Password</label>
                    {isLoginTab && (
                      <button
                        type="button"
                        className="forgot-password-trigger"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMsg(null);
                          setPassword('');
                          setOtp('');
                          setIsOtpSent(false);
                        }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
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
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="otp">Enter 6-Digit OTP Code</label>
                  <div className="otp-input-container">
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      placeholder="••••••"
                      required
                      disabled={loadingState}
                      className="otp-field"
                    />
                    <div className="otp-info-footer">
                      <span className="sent-to-text">Sent to: <strong>{email}</strong></span>
                      <div className="otp-actions-wrapper">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          className="otp-action-link resend"
                          disabled={loadingState}
                        >
                          Resend OTP
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsOtpSent(false);
                            setOtp('');
                          }}
                          className="otp-action-link change-email"
                        >
                          Change Email
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          )}

          <button type="submit" className="submit-auth-btn glow-effect" disabled={loadingState}>
            {loadingState ? (
              <div className="auth-spinner"></div>
            ) : (
              <span>
                {isForgotPassword 
                  ? (!isOtpSent ? 'Send Reset Code' : 'Reset Password')
                  : (!isOtpSent ? 'Send OTP Code' : 'Verify & Sign In')}
              </span>
            )}
          </button>

          {isForgotPassword && (
            <div className="forgot-password-back-container">
              <button
                type="button"
                className="forgot-password-back-btn"
                onClick={() => {
                  setIsForgotPassword(false);
                  setErrorMsg(null);
                  setPassword('');
                  setOtp('');
                  setIsOtpSent(false);
                }}
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
