import React, { useState } from 'react';
import { useToast } from '../../context/DataContext';
import { Eye, EyeOff, RefreshCw, Check, Copy, KeyRound, X } from 'lucide-react';
import { getStudentPassword, saveStudentPassword, formatStudentInvite } from '../../utils/credentialsVault';

const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 8; i++) {
    pw += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pw;
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600,
  letterSpacing: '0.05em', textTransform: 'uppercase',
  color: 'var(--txt-secondary)', marginBottom: 6,
};

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.40)', backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.60)',
  borderRadius: 'var(--r-sm)', padding: '10px 12px', fontSize: 13.5,
  color: 'var(--txt-primary)', fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', transition: 'all 0.15s',
  boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
};

export default function EditPasswordModal({ student, onClose, onUpdated }) {
  const toast = useToast();
  const currentPw = getStudentPassword(student);
  const [password, setPassword] = useState(currentPw);
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSave = (copyAfter = false) => {
    if (!password.trim()) {
      setError('Password cannot be empty.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    saveStudentPassword(student, password.trim());

    if (copyAfter) {
      const inviteText = formatStudentInvite(student, password.trim());
      navigator.clipboard.writeText(inviteText);
      toast(`Password updated & credentials copied for ${student.firstName}!`);
    } else {
      toast(`Password updated for ${student.firstName}!`);
    }

    if (onUpdated) onUpdated(password.trim());
    onClose();
  };

  const handleCopyInvite = () => {
    const inviteText = formatStudentInvite(student, password);
    navigator.clipboard.writeText(inviteText);
    setCopied(true);
    toast('Credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="g-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="glass-4 g-modal"
        onClick={e => e.stopPropagation()}
        style={{ padding: '28px 26px', maxWidth: 440, width: '100%' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-text)'
            }}>
              <KeyRound size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Manage Password
              </h2>
              <div style={{ fontSize: 12, color: 'var(--txt-secondary)' }}>
                {student.firstName} {student.lastName}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="g-btn g-btn-ghost" style={{ padding: '6px 8px' }}>
            <X size={15} />
          </button>
        </div>

        {/* Student Email info */}
        <div style={{
          background: 'rgba(255,255,255,0.40)', border: '1px solid rgba(255,255,255,0.60)',
          borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 16,
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase' }}>
            Student Email
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--txt-primary)', marginTop: 2 }}>
            {student.email}
          </div>
        </div>

        {/* Password input & controls */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...labelStyle, margin: 0 }}>Password</label>
            <button
              type="button"
              onClick={() => {
                const newRandom = generateRandomPassword();
                setPassword(newRandom);
                setError('');
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 11, color: 'var(--accent-text)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4, padding: 0
              }}
            >
              <RefreshCw size={11} /> Generate random
            </button>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              style={{
                ...inputStyle,
                fontFamily: 'monospace',
                fontSize: 14.5,
                fontWeight: 600,
                letterSpacing: showPassword ? '0.05em' : '0.15em',
                paddingRight: 72,
              }}
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError('');
              }}
            />
            <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="g-btn g-btn-ghost"
                style={{ padding: '4px 6px', color: 'var(--txt-secondary)' }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="g-btn g-btn-ghost"
                style={{ padding: '4px 6px', color: copied ? 'var(--clr-done-txt)' : 'var(--accent-text)' }}
                title="Copy student login invite"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: 8, padding: '8px 12px', background: 'var(--clr-overdue)',
              border: '1px solid var(--clr-overdue-bd)', borderRadius: 'var(--r-sm)',
              fontSize: 11.5, color: 'var(--clr-overdue-txt)',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onClose} className="g-btn g-btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="g-btn g-btn-secondary"
            style={{ fontSize: 12 }}
          >
            <Copy size={13} /> Save & Copy
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="g-btn g-btn-primary"
            style={{ fontSize: 12 }}
          >
            Save Password
          </button>
        </div>
      </div>
    </div>
  );
}
