import React from 'react';

/**
 * Universal Badge pill
 * Types: 'not_started' | 'in_progress' | 'submitted' | 'under_review' | 'needs_revision' | 'done' | 'pending' | 'overdue'
 */
export default function Badge({ type = 'not_started', children, className = '', style }) {
  return (
    <span className={`g-badge g-badge-${type} badge-${type} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}