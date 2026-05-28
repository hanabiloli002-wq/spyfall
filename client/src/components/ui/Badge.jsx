import React from 'react';

const styles = {
  violet: 'badge-violet',
  emerald: 'badge-emerald',
  rose: 'badge-rose',
  slate: 'badge-slate',
};

export default function Badge({ children, variant = 'violet', className = '' }) {
  return (
    <span className={`${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}
