import React, { useState, useEffect } from 'react';
import { useData, useToast } from '../../context/DataContext';
import {
  KeyRound, Mail, User, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, ShieldCheck, Loader2, Save, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import { updateEmail, updatePassword, updateProfile, verifyPassword } from '../../lib/supabase/auth.js';
import Breadcrumbs from '../../components/common/Breadcrumbs';

export default function TeacherSettings() {
  const { session, profile, refreshProfile } = useData();
  const toast = useToast();
  const user = session?.user;

  // ── Progressive disclosure for advanced security settings ──
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Profile Form State ─────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // ── Email Form State ───────────────────────────
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  // ── Password Form State ────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError, setPwError] = useState('');

  // ── Initialize profile fields from profile data (not session) ──
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || user?.firstName || '');
      setLastName(profile.last_name || user?.lastName || '');
    } else if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
    }
  }, [profile, user]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  // ── Handle Update Profile (Name) ───────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess(false);

    if (!firstName.trim() || !lastName.trim()) {
      return setProfileError('First name and last name cannot be empty.');
    }

    setProfileSaving(true);
    try {
      if (profile?.id) {
        await updateProfile(profile.id, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });
      }
      if (refreshProfile) await refreshProfile();
      setProfileSuccess(true);
      toast('Profile information updated successfully!');
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.message || 'Failed to update profile information.');
      toast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Handle Change Email ────────────────────────
  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedEmail) {
      return setEmailError('Please enter a new email address.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return setEmailError('Please enter a valid email address.');
    }
    if (trimmedEmail === (user?.email || '').toLowerCase()) {
      return setEmailError('The new email must be different from your current email.');
    }
    if (!emailCurrentPassword) {
      return setEmailError('Please enter your current password to confirm this change.');
    }

    setEmailSaving(true);
    try {
      // 1. Verify current password
      await verifyPassword(user.email, emailCurrentPassword);

      // 2. Request email update in Supabase
      const res = await updateEmail(trimmedEmail);
      if (refreshProfile) await refreshProfile();

      setNewEmail('');
      setEmailCurrentPassword('');

      if (res?.user?.email === trimmedEmail) {
        setEmailSuccess('Email updated successfully!');
        toast('Email updated successfully!');
      } else {
        setEmailSuccess('Confirmation link sent! Please check both your current and new email inbox to confirm.');
        toast('Confirmation email sent.');
      }
    } catch (err) {
      console.error('Update email error:', err);
      setEmailError(err.message || 'Failed to update email. Please check your current password.');
      toast(err.message || 'Email update failed.', 'error');
    } finally {
      setEmailSaving(false);
    }
  };

  // ── Handle Change Password ─────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      return setPwError('Please enter your current password.');
    }
    if (newPassword.length < 6) {
      return setPwError('New password must be at least 6 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setPwError('New passwords do not match.');
    }
    if (newPassword === currentPassword) {
      return setPwError('New password cannot be the same as your current password.');
    }

    setPwSaving(true);
    try {
      // 1. Verify current password (this also re-authenticates the session)
      await verifyPassword(user.email, currentPassword);

      // 2. Update password
      await updatePassword(newPassword);

      // 3. Re-authenticate with the NEW password to keep the session valid
      try {
        await verifyPassword(user.email, newPassword);
      } catch (_) {
        // Non-critical — session may still be valid from the updatePassword call
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess('Password changed successfully! Your new password is now active.');
      toast('Password updated successfully!');
    } catch (err) {
      console.error('Update password error:', err);
      const msg = err.message || 'Failed to change password.';
      setPwError(
        msg.includes('does not match')
          ? 'Current password is incorrect. Please try again.'
          : msg
      );
      toast('Password change failed.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Password validation checks ──
  const pwLengthOk = newPassword.length >= 6;
  const pwMatchOk = newPassword && newPassword === confirmPassword;
  const pwDiffOk = newPassword && newPassword !== currentPassword;

  return (
    <div className="g-page ts-page">
      <Breadcrumbs items={[{ label: 'Home', to: '/teacher/dashboard' }, { label: 'Settings' }]} />

      {/* ── Header ── */}
      <div className="ts-header">
        <div className="ts-header-badge">
          <ShieldCheck size={13} />
          <span>Account Settings</span>
        </div>
        <h1>Settings</h1>
        <p>Manage your account security, email, password, and personal profile information.</p>
      </div>

      {/* ── Profile Banner ── */}
      <div className="glass-card ts-profile-banner">
        <div className="ts-profile-info">
          <div className="ts-profile-avatar">{initials}</div>
          <div>
            <div className="ts-profile-name">
              <span>{user?.firstName} {user?.lastName}</span>
              <span className="ts-role-badge">Teacher</span>
            </div>
            <div className="ts-profile-email">
              <Mail size={13} style={{ opacity: 0.6 }} />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>
        <div className="ts-profile-meta">
          <div>Role: <strong>Instructor</strong></div>
          <div style={{ marginTop: 2 }}>
            Status: <span style={{ color: '#059669', fontWeight: 600 }}>Active ✓</span>
          </div>
        </div>
      </div>

      {/* ── 1. PRIMARY SECTION: PERSONAL PROFILE ── */}
      <div className="ts-card">
        <div className="ts-card-header">
          <div className="ts-card-icon">
            <User size={16} />
          </div>
          <div>
            <h2 className="ts-card-title">Personal Profile</h2>
            <p className="ts-card-desc">Your display name and account information visible to your students</p>
          </div>
        </div>

        {profileError && (
          <div className="ts-alert ts-alert-error" key={profileError}>
            <AlertCircle size={15} />
            <span>{profileError}</span>
          </div>
        )}
        {profileSuccess && (
          <div className="ts-alert ts-alert-success">
            <CheckCircle2 size={15} />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="ts-form-row" style={{ marginBottom: 18 }}>
            <div>
              <label className="ts-label">First Name</label>
              <input
                className="ts-input"
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Sarah"
                disabled={profileSaving}
                required
              />
            </div>
            <div>
              <label className="ts-label">Last Name</label>
              <input
                className="ts-input"
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Mitchell"
                disabled={profileSaving}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="ts-label">Current Account Email</label>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
              fontSize: 13.5, color: 'var(--color-text)', fontWeight: 500
            }}>
              <span>{user?.email}</span>
              <span className="ts-verified-badge" style={{ margin: 0 }}>✓ Verified</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={profileSaving || !firstName.trim() || !lastName.trim()}
              className="g-btn g-btn-primary"
              style={{ minWidth: 140 }}
            >
              {profileSaving ? (
                <>
                  <Loader2 size={14} className="ts-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── 2. PROGRESSIVE DISCLOSURE: ADVANCED SECURITY SETTINGS ── */}
      <div className="ts-card" style={{ padding: 0, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface-muted)',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.15s ease',
          }}
          aria-expanded={showAdvanced}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="ts-card-icon" style={{ width: 34, height: 34 }}>
              <KeyRound size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                Advanced Security & Credentials
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>
                Change your account password or update your login email
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 600 }}>
            <span>{showAdvanced ? 'Hide options' : 'Configure options'}</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showAdvanced && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)' }}>
            {/* Change Password Sub-card */}
            <div style={{ marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Lock size={15} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  Change Password
                </h3>
              </div>

              {pwError && (
                <div className="ts-alert ts-alert-error" key={pwError}>
                  <AlertCircle size={15} />
                  <span>{pwError}</span>
                </div>
              )}
              {pwSuccess && (
                <div className="ts-alert ts-alert-success" key={pwSuccess}>
                  <CheckCircle2 size={15} />
                  <span>{pwSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className="ts-form-group" style={{ marginBottom: 14 }}>
                  <label className="ts-label">Current Password</label>
                  <div className="ts-input-pw-wrap">
                    <input
                      className="ts-input"
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      disabled={pwSaving}
                      required
                    />
                    <button
                      type="button"
                      className="ts-pw-toggle"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      tabIndex={-1}
                    >
                      {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="ts-form-row" style={{ marginBottom: 12 }}>
                  <div>
                    <label className="ts-label">New Password</label>
                    <div className="ts-input-pw-wrap">
                      <input
                        className="ts-input"
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        disabled={pwSaving}
                        required
                      />
                      <button
                        type="button"
                        className="ts-pw-toggle"
                        onClick={() => setShowNewPw(!showNewPw)}
                        tabIndex={-1}
                      >
                        {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="ts-label">Confirm New Password</label>
                    <div className="ts-input-pw-wrap">
                      <input
                        className="ts-input"
                        type={showConfirmPw ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        disabled={pwSaving}
                        required
                      />
                      <button
                        type="button"
                        className="ts-pw-toggle"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        tabIndex={-1}
                      >
                        {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password strength checks */}
                <div className="ts-pw-checks" style={{ marginBottom: 16 }}>
                  <span className={`ts-pw-check${pwLengthOk ? ' pass' : ''}`}>
                    {pwLengthOk ? <Check size={13} strokeWidth={2.5} /> : '○'} At least 6 characters
                  </span>
                  <span className={`ts-pw-check${pwMatchOk ? ' pass' : ''}`}>
                    {pwMatchOk ? <Check size={13} strokeWidth={2.5} /> : '○'} Passwords match
                  </span>
                  <span className={`ts-pw-check${pwDiffOk ? ' pass' : ''}`}>
                    {pwDiffOk ? <Check size={13} strokeWidth={2.5} /> : '○'} Different from current
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={pwSaving || !currentPassword || !pwLengthOk || !pwMatchOk}
                    className="g-btn g-btn-primary"
                    style={{ minWidth: 150 }}
                  >
                    {pwSaving ? (
                      <>
                        <Loader2 size={14} className="ts-spin" />
                        <span>Updating…</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={14} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Email Sub-card */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Mail size={15} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: 14.5, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                  Change Email Address
                </h3>
              </div>

              {emailError && (
                <div className="ts-alert ts-alert-error" key={emailError}>
                  <AlertCircle size={15} />
                  <span>{emailError}</span>
                </div>
              )}
              {emailSuccess && (
                <div className="ts-alert ts-alert-success" key={emailSuccess}>
                  <CheckCircle2 size={15} />
                  <span>{emailSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangeEmail}>
                <div className="ts-form-row" style={{ marginBottom: 14 }}>
                  <div>
                    <label className="ts-label">New Email Address</label>
                    <input
                      className="ts-input"
                      type="email"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      placeholder="new.email@school.edu"
                      disabled={emailSaving}
                      required
                    />
                  </div>
                  <div>
                    <label className="ts-label">Current Password (verification)</label>
                    <div className="ts-input-pw-wrap">
                      <input
                        className="ts-input"
                        type={showEmailPw ? 'text' : 'password'}
                        value={emailCurrentPassword}
                        onChange={e => setEmailCurrentPassword(e.target.value)}
                        placeholder="Enter password"
                        disabled={emailSaving}
                        required
                      />
                      <button
                        type="button"
                        className="ts-pw-toggle"
                        onClick={() => setShowEmailPw(!showEmailPw)}
                        tabIndex={-1}
                      >
                        {showEmailPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ts-form-footer">
                  <span className="ts-form-footer-hint">
                    A confirmation email will be sent to verify your new email.
                  </span>
                  <button
                    type="submit"
                    disabled={emailSaving || !newEmail.trim() || !emailCurrentPassword}
                    className="g-btn g-btn-primary"
                    style={{ minWidth: 140 }}
                  >
                    {emailSaving ? (
                      <>
                        <Loader2 size={14} className="ts-spin" />
                        <span>Updating…</span>
                      </>
                    ) : (
                      <>
                        <Mail size={14} />
                        <span>Update Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
