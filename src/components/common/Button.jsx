import React from 'react';

/**
 * Universal Button primitive
 * Variants: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'glass'
 */
export default function Button({ 
  variant = 'secondary', 
  children, 
  onClick, 
  style, 
  disabled = false,
  type = 'button',
  className = '',
  ...props 
}) {
  // Normalize legacy 'glass' variant to academic 'secondary' or 'ghost'
  const resolvedVariant = variant === 'glass' ? 'secondary' : variant;
  const buttonClass = `g-btn g-btn-${resolvedVariant} ${className}`.trim();

  return (
    <button 
      type={type}
      className={buttonClass} 
      onClick={onClick} 
      disabled={disabled}
      style={style} 
      {...props}
    >
      {children}
    </button>
  );
}