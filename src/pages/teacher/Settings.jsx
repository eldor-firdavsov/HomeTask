import React, { useState, useEffect } from 'react';
import { useData, useToast } from '../../context/DataContext';
import {
  KeyRound, Mail, User, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, ShieldCheck, Loader2, Save, Check
} from 'lucide-react';
import { updateEmail, updatePassword, updateProfile, verifyPassword } from '../../lib/supabase/auth.js';

export default function TeacherSettings() {
  const { session, profile, refreshProfile } = useData();
  const toast = useToast();
  const user = session?.user;

  // ── Tab state: 'security' | 'profile' ───────────
  const [activeTab, setActiveTab] = useState('security');

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

      {/* ── Segmented Tab Navigation ── */}
      <div className="ts-tabs">
        <button
          className={`ts-tab${activeTab === 'security' ? ' active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <KeyRound size={14} />
          <span>Email & Password</span>
        </button>
        <button
          className={`ts-tab${activeTab === 'profile' ? ' active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={14} />
          <span>Profile Details</span>
        </button>
      </div>

      {/* ════════════════════════════════════════════
          TAB 1: SECURITY (EMAIL & PASSWORD)
      ════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="ts-tab-content" key="security">

          {/* ── Change Email Card ── */}
          <div className="ts-card">
            <div className="ts-card-header">
              <div className="ts-card-icon">
                <Mail size={16} />
              </div>
              <div>
                <h2 className="ts-card-title">Change Email Address</h2>
                <p className="ts-card-desc">Update the primary email used for login and notifications</p>
              </div>
            </div>

            {/* Current email display */}
            <div className="ts-current-value">
              <div>
                <div className="ts-current-label">Current Email</div>
                <div className="ts-current-val">{user?.email}</div>
              </div>
              <span className="ts-verified-badge">✓ Verified</span>
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
              <div className="ts-form-row">
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
                  <label className="ts-label">Current Password (verify)</label>
                  <div className="ts-input-pw-wrap">
                    <input
                      className="ts-input"
                      type={showEmailPw ? 'text' : 'password'}
                      value={emailCurrentPassword}
                      onChange={e => setEmailCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
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
                  A confirmation email will be sent to verify your new address.
                </span>
                <button
                  type="submit"
                  disabled={emailSaving || !newEmail.trim() || !emailCurrentPassword}
                  className="g-btn g-btn-primary"
                  style={{ minWidth: 130 }}
                >
                  {emailSaving ? (
                    <>
                      <Loader2 size={14} className="ts-spin" />
                      <span>Updating…</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Update Email</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ── Change Password Card ── */}
          <div className="ts-card">
            <div className="ts-card-header">
              <div className="ts-card-icon">
                <Lock size={16} />
              </div>
              <div>
                <h2 className="ts-card-title">Change Password</h2>
                <p className="ts-card-desc">Keep your account secure with a strong, unique password</p>
              </div>
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
              {/* Current Password */}
              <div className="ts-form-group">
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

              {/* New Password & Confirm */}
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
              <div className="ts-pw-checks">
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
                  style={{ minWidth: 160 }}
                >
                  {pwSaving ? (
                    <>
                      <Loader2 size={14} className="ts-spin" />
                      <span>Changing…</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={14} />
                      <span>Change Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════
          TAB 2: PROFILE DETAILS
      ════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="ts-tab-content" key="profile">
          <div className="ts-card">
            <div className="ts-card-header">
              <div className="ts-card-icon">
                <User size={16} />
              </div>
              <div>
                <h2 className="ts-card-title">Personal Information</h2>
                <p className="ts-card-desc">Update your display name visible to your students</p>
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
              <div className="ts-form-row" style={{ marginBottom: 20 }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={profileSaving || !firstName.trim() || !lastName.trim()}
                  className="g-btn g-btn-primary"
                  style={{ minWidth: 130 }}
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
        </div>
      )}
    </div>
  );
}
