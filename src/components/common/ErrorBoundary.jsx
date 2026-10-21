import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#f8fafc',
          fontFamily: 'inherit',
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            background: 'var(--color-surface, #FFFFFF)',
            borderRadius: 'var(--radius-xl, 18px)',
            padding: '36px 32px',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--color-border, #DDE3DC)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'var(--color-danger-soft, #FBEAEA)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-danger, #B33C3C)',
              fontSize: 24,
              marginBottom: 16,
              border: '1px solid var(--color-border, #DDE3DC)',
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text, #202923)', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-text-secondary, #5D685F)', margin: '0 0 20px', lineHeight: 1.5 }}>
              An unexpected error occurred while rendering this view.
            </p>
            {this.state.error?.message && (
              <pre style={{
                textAlign: 'left',
                background: 'var(--color-surface-muted, #F0F3EE)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm, 6px)',
                fontSize: 12,
                color: 'var(--color-danger, #B33C3C)',
                overflowX: 'auto',
                marginBottom: 20,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid var(--color-border, #DDE3DC)',
              }}>
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  background: 'var(--color-primary, #244A3A)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  window.location.href = '/login';
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 'var(--radius-sm, 6px)',
                  background: '#ffffff',
                  color: 'var(--color-text, #202923)',
                  border: '1px solid var(--color-border, #DDE3DC)',
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: 'pointer',
                }}
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
