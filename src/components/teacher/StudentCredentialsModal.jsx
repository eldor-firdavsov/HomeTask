import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, Copy, Check, RefreshCw, X, Globe, User, ShieldCheck } from 'lucide-react';
import { useToast } from '../../context/DataContext';
import { getStudentPassword, formatStudentInvite } from '../../utils/credentialsVault';

export default function StudentCredentialsModal({ student, onClose, onChangePassword }) {
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!student) return null;

  const password = getStudentPassword(student);
  const portalUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/student/login`
    : 'https://hometask.uz/student/login';

  const handleCopyEmail = () => {
    if (!student.email) return;
    navigator.clipboard.writeText(student.email);
    setCopiedEmail(true);
    toast('Student email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopiedPw(true);
    toast('Student password copied to clipboard!');
    setTimeout(() => setCopiedPw(false), 2000);
  };

  const handleCopyPortalUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    setCopiedUrl(true);
    toast('Portal URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyInvite = () => {
    const invite = formatStudentInvite(student, password);
    navigator.clipboard.writeText(invite);
    setCopiedInvite(true);
    toast('Complete student login invite copied!');
    setTimeout(() => setCopiedInvite(false), 2500);
  };

  return (
    <div
      className="g-overlay"
      onClick={onClose}
      style={{
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        className="glass-4 g-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="credentials-modal-title"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '24px',
          borderRadius: 'var(--radius-lg, 12px)',
          background: 'var(--color-surface, #FFFFFF)',
          boxShadow: 'var(--shadow-modal, 0 16px 40px rgba(0,0,0,0.14))',
          border: '1px solid var(--color-border, #D8E0D7)',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--color-primary-soft, #E8EFEA)',
              border: '1px solid rgba(24,106,68,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-primary, #186A44)', flexShrink: 0
            }}>
              <KeyRound size={20} />
            </div>
            <div>
              <h2
                id="credentials-modal-title"
                style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text, #1E2922)', margin: 0 }}
              >
                Student Login Credentials
              </h2>
              <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary, #5C6E63)', marginTop: 2 }}>
                {student.firstName} {student.lastName} · <span style={{ color: 'var(--color-primary, #186A44)', fontWeight: 600 }}>Active Student</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="g-btn g-btn-ghost"
            style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}
            aria-label="Close credentials dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Informative Subtitle */}
        <p style={{
          fontSize: 12.5,
          color: 'var(--color-text-secondary, #5C6E63)',
          lineHeight: 1.5,
          margin: '0 0 18px 0',
        }}>
          Share these credentials with {student.firstName} so they can sign in to their student portal and complete assigned tasks.
        </p>

        {/* Credentials Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {/* Email Block */}
          <div style={{
            background: 'var(--color-surface-muted, #F4F7F4)',
            border: '1px solid var(--color-border, #D8E0D7)',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #5C6E63)',
                letterSpacing: '0.05em',
                marginBottom: 3
              }}>
                Student Login Email
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--color-text, #1E2922)',
                wordBreak: 'break-all'
              }}>
                {student.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="g-btn g-btn-secondary"
              style={{
                fontSize: 12,
                padding: '6px 10px',
                flexShrink: 0,
                gap: 5,
                color: copiedEmail ? 'var(--color-success, #166534)' : undefined,
              }}
              title="Copy login email"
            >
              {copiedEmail ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Password Block */}
          <div style={{
            background: 'var(--color-surface-muted, #F4F7F4)',
            border: '1px solid var(--color-border, #D8E0D7)',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #5C6E63)',
                letterSpacing: '0.05em',
                marginBottom: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                <KeyRound size={11} style={{ color: 'var(--color-primary, #186A44)' }} />
                <span>Student Password</span>
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: 'var(--color-text, #1E2922)',
                letterSpacing: showPassword ? '0.04em' : '0.22em',
              }}>
                {showPassword ? password : '••••••••'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="g-btn g-btn-ghost"
                style={{ padding: '6px 8px', color: 'var(--color-text-secondary)' }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                className="g-btn g-btn-secondary"
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  gap: 5,
                  color: copiedPw ? 'var(--color-success, #166534)' : undefined,
                }}
                title="Copy password"
              >
                {copiedPw ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedPw ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Portal Login URL Block */}
          <div style={{
            background: 'var(--color-surface-muted, #F4F7F4)',
            border: '1px solid var(--color-border, #D8E0D7)',
            borderRadius: 'var(--radius-sm, 8px)',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary, #5C6E63)',
                letterSpacing: '0.05em',
                marginBottom: 2
              }}>
                Student Portal URL
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--color-text-secondary, #5C6E63)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {portalUrl}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyPortalUrl}
              className="g-btn g-btn-ghost"
              style={{
                fontSize: 11.5,
                padding: '5px 8px',
                flexShrink: 0,
                gap: 4,
                color: copiedUrl ? 'var(--color-success, #166534)' : 'var(--color-text-secondary)',
              }}
              title="Copy portal URL"
            >
              {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          borderTop: '1px solid var(--color-border, #D8E0D7)',
          paddingTop: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleCopyInvite}
              className="g-btn g-btn-primary"
              style={{ fontSize: 12.5, padding: '7px 14px', gap: 6 }}
            >
              {copiedInvite ? <Check size={14} /> : <Copy size={14} />}
              <span>{copiedInvite ? 'Copied Full Invite!' : 'Copy Invite Text'}</span>
            </button>

            {onChangePassword && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangePassword();
                }}
                className="g-btn g-btn-secondary"
                style={{ fontSize: 12.5, padding: '7px 12px', gap: 6 }}
              >
                <RefreshCw size={13} />
                <span>Change Password</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="g-btn g-btn-ghost"
            style={{ fontSize: 12.5, padding: '7px 14px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
