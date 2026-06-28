'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiDataSource } from '../../../data/datasources/chat-api-datasource';
import './UsageModal.css';

interface ModelUsage {
  model: string;
  displayName: string;
  color: string;
  tokensUsed: number;
  budget: number;
  percentage: number;
  totalRequests: number;
  lastUsed: string | null;

  monthlyTokensUsed: number;
  monthlyRequests: number;
  monthlyResetTime: string;

  weeklyTokensUsed: number;
  weeklyRequests: number;
  weeklyResetTime: string;

  fiveHourlyTokensUsed: number;
  fiveHourlyRequests: number;
  fiveHourlyResetTime: string;
}

interface UsageData {
  models: ModelUsage[];
  totalTokensUsed: number;
  totalRequests: number;
  generatedAt: string;
}

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// SVG Circular Progress Ring
const CircularRing: React.FC<{
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({ percentage, color, size = 130, strokeWidth = 10, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPct = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPct / 100) * circumference;

  // Color gradient based on percentage
  const ringColor = clampedPct >= 90 ? '#ef4444' : clampedPct >= 70 ? '#f59e0b' : color;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="usage-ring-svg">
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${color.replace('#', '')}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />

      {/* Progress ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={ringColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        filter={`url(#glow-${color.replace('#', '')})`}
        className="usage-ring-progress"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />

      {/* Center content */}
      <foreignObject x="0" y="0" width={size} height={size}>
        <div className="ring-center-content">
          {children}
        </div>
      </foreignObject>
    </svg>
  );
};

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animatePct, setAnimatePct] = useState(false);
  const [activeTab, setActiveTab] = useState<'consumption' | 'system'>('consumption');

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAnimatePct(false);
    try {
      const result = await apiDataSource.getTokenUsage();
      setData(result);
      // Trigger animation after data loads
      setTimeout(() => setAnimatePct(true), 100);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsage();
    }
  }, [isOpen, fetchUsage]);

  if (!isOpen) return null;

  const modelIcons: Record<string, React.ReactNode> = {
    openai: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
      </svg>
    ),
    gemini: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 2.4c5.304 0 9.6 4.296 9.6 9.6s-4.296 9.6-9.6 9.6S2.4 17.304 2.4 12 6.696 2.4 12 2.4zm0 3.6L7.2 16.8h9.6L12 6z"/>
      </svg>
    ),
    claude: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.304 1.19l-.91 2.797-4.078 12.49-.926 2.835h-2.78l.924-2.835L13.61 4.24H6.696L5.77 7.032H3.027L3.95 4.24 4.878 1.19h12.426zM20.973 22.81l-.924-2.835-4.075-12.49-.926-2.835H12.27l.924 2.835 4.075 12.49.924 2.835h2.78z"/>
      </svg>
    ),
  };

  return (
    <div className="usage-modal-overlay" onClick={onClose}>
      <div className="usage-modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="usage-modal-header">
          <div className="usage-header-left">
            <div className="usage-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <div>
              <h2>Token Usage Monitor</h2>
              <p>Real-time consumption across all AI models</p>
            </div>
          </div>
          <div className="usage-header-right">
            <button className="usage-refresh-btn" onClick={fetchUsage} disabled={loading} title="Refresh">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: loading ? 'spinSlow 0.8s linear infinite' : 'none' }}>
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            <button className="usage-close-btn" onClick={onClose} title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="usage-tabs-container" style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          padding: '0 24px',
          backgroundColor: 'rgba(10, 10, 24, 0.2)',
          gap: '16px'
        }}>
          <button
            className={`usage-tab-btn ${activeTab === 'consumption' ? 'active' : ''}`}
            onClick={() => setActiveTab('consumption')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'consumption' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'consumption' ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Token Consumption
          </button>
          <button
            className={`usage-tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: activeTab === 'system' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'system' ? '2px solid var(--accent-secondary)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'var(--transition-smooth)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            System Status
          </button>
        </div>

        {/* Content */}
        {loading && !data ? (
          <div className="usage-loading-state">
            <div className="usage-spinner-large"></div>
            <span>Fetching token consumption data...</span>
          </div>
        ) : error ? (
          <div className="usage-error-state">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>{error}</p>
            <button className="usage-retry-btn" onClick={fetchUsage}>Retry</button>
          </div>
        ) : data ? (
          <>
            {activeTab === 'consumption' ? (
              <>
                {/* Summary Bar */}
                <div className="usage-summary-bar">
                  <div className="summary-stat">
                    <span className="stat-value">{formatTokens(data.totalTokensUsed)}</span>
                    <span className="stat-label">Total Tokens Used</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-stat">
                    <span className="stat-value">{data.totalRequests.toLocaleString()}</span>
                    <span className="stat-label">Total Requests</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-stat">
                    <span className="stat-value">{data.models.filter(m => m.tokensUsed > 0).length}</span>
                    <span className="stat-label">Active Models</span>
                  </div>
                </div>

                {/* Rings Grid */}
                <div className="usage-rings-grid">
                  {data.models.map((model) => (
                    <div key={model.model} className="usage-ring-card">
                      <div className="ring-card-header">
                        <span className="ring-model-icon" style={{ color: model.color }}>
                          {modelIcons[model.model] ?? null}
                        </span>
                        <span className="ring-model-name">{model.displayName}</span>
                      </div>

                      <div className="ring-wrapper">
                        <CircularRing
                          percentage={animatePct ? model.percentage : 0}
                          color={model.color}
                          size={130}
                          strokeWidth={10}
                        >
                          <div className="ring-pct-text">
                            <span className="ring-pct-number" style={{ color: model.color }}>
                              {model.percentage.toFixed(1)}
                            </span>
                            <span className="ring-pct-symbol">%</span>
                          </div>
                        </CircularRing>
                      </div>

                      <div className="ring-card-stats">
                        <div className="ring-stat-row">
                          <span className="ring-stat-label">Total Used</span>
                          <span className="ring-stat-value" style={{ color: model.color }}>
                            {formatTokens(model.tokensUsed)}
                          </span>
                        </div>
                        <div className="ring-stat-row">
                          <span className="ring-stat-label">Total Requests</span>
                          <span className="ring-stat-value">{model.totalRequests.toLocaleString()}</span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0', paddingTop: '8px' }} />

                        <div className="ring-stat-row" title={`Next Reset: ${formatDate(model.fiveHourlyResetTime)}`}>
                          <span className="ring-stat-label" style={{ color: 'var(--text-secondary)' }}>5-Hour Limit</span>
                          <span className="ring-stat-value" style={{ color: 'var(--accent-secondary)' }}>
                            {formatTokens(model.fiveHourlyTokensUsed)} ({model.fiveHourlyRequests} req)
                          </span>
                        </div>

                        <div className="ring-stat-row" title={`Next Reset: ${formatDate(model.weeklyResetTime)}`}>
                          <span className="ring-stat-label" style={{ color: 'var(--text-secondary)' }}>Weekly Limit</span>
                          <span className="ring-stat-value" style={{ color: '#fbbf24' }}>
                            {formatTokens(model.weeklyTokensUsed)} ({model.weeklyRequests} req)
                          </span>
                        </div>

                        <div className="ring-stat-row" title={`Next Reset: ${formatDate(model.monthlyResetTime)}`}>
                          <span className="ring-stat-label" style={{ color: 'var(--text-secondary)' }}>Monthly Limit</span>
                          <span className="ring-stat-value" style={{ color: '#34d399' }}>
                            {formatTokens(model.monthlyTokensUsed)} ({model.monthlyRequests} req)
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '8px 0', paddingTop: '8px' }} />

                        <div className="ring-stat-row">
                          <span className="ring-stat-label">Last used</span>
                          <span className="ring-stat-value ring-stat-date">{formatDate(model.lastUsed)}</span>
                        </div>
                      </div>

                      {/* Mini linear bar under ring card */}
                      <div className="ring-linear-bar-track">
                        <div
                          className="ring-linear-bar-fill"
                          style={{
                            width: animatePct ? `${Math.min(100, model.percentage)}%` : '0%',
                            backgroundColor: model.color,
                            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)',
                            boxShadow: `0 0 8px ${model.color}60`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Analytics Dashboard section */}
                <div className="usage-analytics-section">
                  <div className="profile-divider" style={{ margin: '24px 0 16px 0' }}>
                    <span>Usage Share Analytics</span>
                  </div>
                  <div className="analytics-box glass-panel" style={{ padding: '16px 20px', borderRadius: 'var(--border-radius-md)' }}>
                    <h4 className="analytics-title" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      Token Distribution Share
                    </h4>
                    
                    {/* Horizontal Share Bar */}
                    <div className="share-bar-container">
                      <div className="share-bar-visual" style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', overflow: 'hidden', marginBottom: '16px' }}>
                        {data.models.map((model) => {
                          const sharePct = data.totalTokensUsed > 0 
                            ? (model.tokensUsed / data.totalTokensUsed) * 100 
                            : 0;
                          if (sharePct === 0) return null;
                          return (
                            <div
                              key={model.model}
                              className="share-bar-segment"
                              style={{
                                width: animatePct ? `${sharePct}%` : '0%',
                                backgroundColor: model.color,
                                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                height: '100%'
                              }}
                              title={`${model.displayName}: ${sharePct.toFixed(1)}%`}
                            />
                          );
                        })}
                        {data.totalTokensUsed === 0 && (
                          <div className="share-bar-segment-empty" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>No Tokens Consumed</div>
                        )}
                      </div>

                      {/* Legend below bar */}
                      <div className="share-legend-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
                        {data.models.map((model) => {
                          const sharePct = data.totalTokensUsed > 0 
                            ? (model.tokensUsed / data.totalTokensUsed) * 100 
                            : 0;
                          return (
                            <div key={model.model} className="legend-item" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className="legend-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model.color, display: 'inline-block' }} />
                              <div className="legend-info" style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="legend-model-name" style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{model.displayName.split(' — ')[0].split(' ')[0]}</span>
                                <span className="legend-pct-val" style={{ fontSize: '0.8rem', fontWeight: 700, color: model.color }}>
                                  {sharePct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SVG Bar Chart for Request Counts */}
                    <div className="requests-chart-wrapper">
                      <h4 className="analytics-title" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                        Request Volume Comparison
                      </h4>
                      <div className="requests-bar-chart" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {data.models.map((model) => {
                          const maxRequests = Math.max(...data.models.map(m => m.totalRequests), 1);
                          const barPct = (model.totalRequests / maxRequests) * 100;
                          return (
                            <div key={model.model} className="chart-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span className="chart-label" style={{ fontSize: '0.74rem', width: '60px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                {model.displayName.split(' — ')[0].split(' ')[0]}
                              </span>
                              <div className="chart-bar-track" style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  className="chart-bar-fill"
                                  style={{
                                    width: animatePct ? `${barPct}%` : '0%',
                                    backgroundColor: model.color,
                                    transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    height: '100%',
                                    borderRadius: '4px',
                                    boxShadow: `0 0 6px ${model.color}40`
                                  }}
                                />
                              </div>
                              <span className="chart-val" style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 700, minWidth: '50px', textAlign: 'right' }}>
                                {model.totalRequests}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="usage-footer-note">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  Percentages shown relative to configured monthly budget per model. Updated: {new Date(data.generatedAt).toLocaleTimeString()}
                </div>
              </>
            ) : (
              <div className="system-dashboard-container animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '500px', overflowY: 'auto' }}>
                
                {/* Uptime Services Section */}
                <div className="system-section">
                  <h4 className="analytics-title" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Cyber Uptime Status Monitor
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="uptime-glow-dot-green" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#39ff14', boxShadow: '0 0 8px #39ff14', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>GarionX Core AI Gateway</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#39ff14', fontWeight: 700 }}>99.98%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="uptime-glow-dot-green" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#39ff14', boxShadow: '0 0 8px #39ff14', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Supabase Postgres Portal</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#39ff14', fontWeight: 700 }}>100.00%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="uptime-glow-dot-green" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#39ff14', boxShadow: '0 0 8px #39ff14', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>File Storage Vault</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#39ff14', fontWeight: 700 }}>99.90%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="uptime-glow-dot-green" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#39ff14', boxShadow: '0 0 8px #39ff14', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Segmind Video Renderer</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#39ff14', fontWeight: 700 }}>98.75%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', gridColumn: 'span 2' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="uptime-glow-dot-amber" style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', boxShadow: '0 0 8px #fbbf24', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>AnimateX Vector Generator (Fal.ai)</span>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>MAINTENANCE (OFFLINE)</span>
                    </div>
                  </div>
                </div>

                {/* API Latency Section */}
                <div className="system-section">
                  <h4 className="analytics-title" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    API Connection Latency
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.78rem', width: '120px', color: 'var(--text-secondary)', fontWeight: 600 }}>Database Ping</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '15%', height: '100%', backgroundColor: '#00ffcc', boxShadow: '0 0 6px #00ffcc' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#00ffcc', fontWeight: 700 }}>45 ms</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.78rem', width: '120px', color: 'var(--text-secondary)', fontWeight: 600 }}>Router (Groq LLM)</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '45%', height: '100%', backgroundColor: '#c084fc', boxShadow: '0 0 6px #c084fc' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#c084fc', fontWeight: 700 }}>450 ms</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.78rem', width: '120px', color: 'var(--text-secondary)', fontWeight: 600 }}>Model (Gemini API)</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '70%', height: '100%', backgroundColor: '#3b82f6', boxShadow: '0 0 6px #3b82f6' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#3b82f6', fontWeight: 700 }}>720 ms</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.78rem', width: '120px', color: 'var(--text-secondary)', fontWeight: 600 }}>SVD (Segmind API)</span>
                      <div style={{ flex: 1, height: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '95%', height: '100%', backgroundColor: '#ff007f', boxShadow: '0 0 6px #ff007f' }} />
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#ff007f', fontWeight: 700 }}>2100 ms</span>
                    </div>
                  </div>
                </div>

                {/* Token Generation Performance (SVG Sparkline) */}
                <div className="system-section">
                  <h4 className="analytics-title" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.5px' }}>
                    Token Generation Efficiency
                  </h4>
                  <div style={{ padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Average Processing Speed:</span>
                      <span style={{ fontSize: '1rem', color: '#39ff14', fontWeight: 800, textShadow: '0 0 8px rgba(57, 255, 20, 0.3)' }}>85.4 Tokens/Sec</span>
                    </div>
                    
                    {/* SVG Sparkline */}
                    <div style={{ height: '60px', width: '100%', marginTop: '8px' }}>
                      <svg width="100%" height="60" viewBox="0 0 500 60" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#39ff14" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#39ff14" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 50 Q 50 35 100 20 T 200 28 T 300 12 T 400 18 T 500 5"
                          fill="none"
                          stroke="#39ff14"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M 0 50 Q 50 35 100 20 T 200 28 T 300 12 T 400 18 T 500 5 L 500 60 L 0 60 Z"
                          fill="url(#sparkline-grad)"
                        />
                      </svg>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      <span>10 requests ago</span>
                      <span>Latest request</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
