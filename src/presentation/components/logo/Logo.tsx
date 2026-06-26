import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', animated = true }) => {
  return (
    <div className={`logo-container logo-${size}`}>
      <div className={`logo-orb ${animated ? 'animate-orb' : ''}`}>
        <div className="logo-inner-core"></div>
        <div className="logo-pulse-ring-1"></div>
        <div className="logo-pulse-ring-2"></div>
      </div>
      <div className={`logo-ring ${animated ? 'animate-ring' : ''}`}>
        <span className="logo-dot dot-1"></span>
        <span className="logo-dot dot-2"></span>
      </div>
    </div>
  );
};
