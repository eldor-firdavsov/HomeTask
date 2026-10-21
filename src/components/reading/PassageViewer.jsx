import React from 'react';

/**
 * Renders an IELTS reading passage with proper formatting
 * 
 * @param {string} title - Passage title
 * @param {string} text - Full passage text
 * @param {boolean} compact - Whether to use compact mode
 */
export default function PassageViewer({ title, text, compact = false }) {
  // Split text into paragraphs
  const paragraphs = (text || '').split(/\n\n+/).filter(p => p.trim());

  return (
    <div className="passage-viewer" style={{
      padding: compact ? '16px 18px' : '24px 28px',
      background: 'rgba(255, 255, 255, 0.55)',
      borderRadius: 'var(--r-lg)',
      border: '1px solid rgba(255, 255, 255, 0.65)',
      height: '100%',
      overflow: 'auto',
    }}>
      {title && (
        <h2 style={{
          fontSize: compact ? 16 : 19,
          fontWeight: 700,
          color: 'var(--txt-primary)',
          marginBottom: compact ? 12 : 18,
          paddingBottom: 10,
          borderBottom: '2px solid rgba(99, 102, 241, 0.2)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
      )}

      <div style={{ fontSize: compact ? 13.5 : 15, lineHeight: 1.8, color: 'var(--txt-primary)' }}>
        {paragraphs.map((para, i) => {
          // Check for headings (lines starting with # or all caps short lines)
          const isHeading = para.startsWith('#') ||
            (para.length < 80 && para === para.toUpperCase() && !para.includes('.'));

          if (isHeading) {
            return (
              <h3 key={i} style={{
                fontSize: compact ? 14 : 16,
                fontWeight: 700,
                color: 'var(--accent-text)',
                margin: '20px 0 8px',
              }}>
                {para.replace(/^#+\s*/, '')}
              </h3>
            );
          }

          return (
            <p key={i} style={{
              margin: '0 0 14px',
              textAlign: 'justify',
              textIndent: i > 0 ? '1.5em' : 0,
            }}>
              {formatInlineText(para)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Format inline text — handle bold, italic
 */
function formatInlineText(text) {
  // Basic markdown-like formatting
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}
