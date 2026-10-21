import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Unified HomeTask Brand Component
 * Supports:
 *  - 'full': full logo image with emblem + typography
 *  - 'icon': emblem only (mortarboard + house + gold book), perfect for sidebar crests, mobile bars, badges
 *  - 'horizontal': emblem image paired with crisp academic typography and optional portal subtitle
 */
export default function BrandLogo({
  variant = 'horizontal',
  size = 36,
  subtitle = '',
  linkTo = null,
  style = {},
  className = '',
  imgStyle = {},
}) {
  const content = (
    <div
      className={`hometask-brand-lockup ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'full' ? 0 : 10,
        textDecoration: 'none',
        userSelect: 'none',
        ...style,
      }}
    >
      {variant === 'full' ? (
        <img
          src="/assets/hometask-logo.png"
          alt="HomeTask logo"
          style={{
            height: size,
            width: 'auto',
            maxHeight: size,
            objectFit: 'contain',
            display: 'block',
            ...imgStyle,
          }}
        />
      ) : variant === 'icon' ? (
        <img
          src="/assets/hometask-icon.png"
          alt="HomeTask crest"
          style={{
            width: size,
            height: size,
            objectFit: 'contain',
            display: 'block',
            flexShrink: 0,
            ...imgStyle,
          }}
        />
      ) : (
        /* 'horizontal' lockup: emblem icon + bold HomeTask title & subtitle */
        <>
          <div
            style={{
              width: size,
              height: size,
              borderRadius: Math.max(8, Math.round(size * 0.25)),
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <img
              src="/assets/hometask-icon.png"
              alt="HomeTask crest"
              style={{
                width: size,
                height: size,
                objectFit: 'contain',
                display: 'block',
                ...imgStyle,
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: Math.max(15, Math.round(size * 0.44)),
                fontWeight: 800,
                letterSpacing: '-0.025em',
                color: 'var(--color-primary, #244A3A)',
                lineHeight: 1.15,
                whiteSpace: 'nowrap',
              }}
            >
              HomeTask
            </span>
            {subtitle && (
              <span
                style={{
                  fontSize: Math.max(10, Math.round(size * 0.28)),
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent, #B08A4A)',
                  marginTop: 1.5,
                  whiteSpace: 'nowrap',
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {content}
      </Link>
    );
  }

  return content;
}
