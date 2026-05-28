import React from 'react';

export default function Card({ children, className = '', glowColor = null, ...props }) {
  const glowStyle = glowColor
    ? { boxShadow: `0 0 30px ${glowColor}33, 0 0 60px ${glowColor}11` }
    : {};

  return (
    <div
      className={`glass-card ${className}`}
      style={glowStyle}
      {...props}
    >
      {children}
    </div>
  );
}
