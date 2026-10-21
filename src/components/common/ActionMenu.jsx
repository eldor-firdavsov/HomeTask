import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

/**
 * Compact contextual 3-dot menu for secondary and advanced actions.
 * Follows WCAG accessible menu design patterns with escape key & outside click handlers.
 */
export default function ActionMenu({ items = [], ariaLabel = 'More actions', align = 'right', trigger = null }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!items || items.length === 0) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {trigger ? (
        <span
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(prev => !prev);
          }}
          style={{ cursor: 'pointer', display: 'inline-flex' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(prev => !prev);
            }
          }}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label={ariaLabel}
        >
          {trigger}
        </span>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(prev => !prev);
          }}
          className="g-btn g-btn-ghost"
          style={{
            padding: '6px 7px',
            borderRadius: 'var(--radius-sm, 6px)',
            color: open ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            background: open ? 'var(--color-primary-soft)' : 'transparent',
            border: '1px solid transparent',
          }}
          aria-label={ariaLabel}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <MoreVertical size={16} />
        </button>
      )}

      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 90,
            minWidth: 180,
            background: 'var(--color-surface, #FFFFFF)',
            border: '1px solid var(--color-border, #D8E0D7)',
            borderRadius: 'var(--radius-md, 10px)',
            boxShadow: 'var(--shadow-popover, 0 4px 16px rgba(0,0,0,0.1))',
            padding: '4px',
            animation: 'fadeIn 0.12s ease-out',
          }}
        >
          {items.map((item, idx) => {
            if (item.separator) {
              return (
                <div
                  key={`sep-${idx}`}
                  style={{
                    height: 1,
                    background: 'var(--color-border-subtle, #E8ECE7)',
                    margin: '4px 0',
                  }}
                />
              );
            }

            const Icon = item.icon;
            const isDanger = item.danger;

            return (
              <button
                key={item.label || idx}
                role="menuitem"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(false);
                  if (item.onClick) item.onClick();
                }}
                disabled={item.disabled}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12.5,
                  fontWeight: 500,
                  color: isDanger
                    ? 'var(--color-danger, #B33C3C)'
                    : 'var(--color-text, #1A241E)',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  opacity: item.disabled ? 0.5 : 1,
                  textAlign: 'left',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.background = isDanger
                      ? 'var(--color-danger-soft, #FBEAEA)'
                      : 'var(--color-surface-muted, #F0F3EE)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {Icon && <Icon size={14} style={{ opacity: isDanger ? 1 : 0.75, flexShrink: 0 }} />}
                <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
