import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Accessible, academic Breadcrumbs component
 * 
 * @param {Array<{ label: string, to?: string, current?: boolean }>} items
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 14,
        fontSize: 12.5,
        color: 'var(--color-text-secondary, #5D685F)',
      }}
    >
      <ol
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 6,
          listStyle: 'none',
          padding: 0,
          margin: 0,
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1 || item.current;

          return (
            <li
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {index > 0 && (
                <ChevronRight
                  size={13}
                  strokeWidth={2}
                  style={{
                    color: 'var(--color-border-strong, #C5CFC5)',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                />
              )}

              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  style={{
                    color: isLast ? 'var(--color-text, #202923)' : 'var(--color-text-secondary, #5D685F)',
                    fontWeight: isLast ? 600 : 400,
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  style={{
                    color: 'var(--color-text-secondary, #5D685F)',
                    textDecoration: 'none',
                    fontWeight: 500,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--color-primary, #244A3A)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--color-text-secondary, #5D685F)';
                  }}
                >
                  {index === 0 && <Home size={13} style={{ marginBottom: 1 }} />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
