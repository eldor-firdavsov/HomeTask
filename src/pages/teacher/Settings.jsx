import React, { useState } from 'react';
import { useData, useToast } from '../../context/DataContext';
import {
  KeyRound, Mail, User, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, ShieldCheck, Loader2, Save, Check
} from 'lucide-react';
import { updateEmail, updatePassword, updateProfile, verifyPassword } from '../../lib/supabase/auth.js';

/* ── Inline Shared Styles ─────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--txt-secondary)',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.45)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.65)',
  borderRadius: 'var(--r-sm)',
  padding: '10px 14px',
  fontSize: 13.5,
  color: 'var(--txt-primary)',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
  boxShadow: '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)',
};

const handleFocus = e => {
  e.target.style.borderColor = 'rgba(99,102,241,0.50)';
  e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.10), 0 2px 8px rgba(30,40,100,0.04)';
  e.target.style.background = 'rgba(255,255,255,0.65)';
};

const handleBlur = e => {
  e.target.style.borderColor = 'rgba(255,255,255,0.65)';
  e.target.style.boxShadow = '0 2px 8px rgba(30,40,100,0.04), inset 0 1px 0 rgba(255,255,255,0.55)';
  e.target.style.background = 'rgba(255,255,255,0.45)';
};

export default function TeacherSettings() {
  const { session, profile, refreshProfile } = useData();
  const toast = useToast();
  const user = session?.user;

  // ── Tab state: 'security' | 'profile' ───────────
  const [activeTab, setActiveTab] = useState('security');

  // ── Profile Form State ─────────────────────────
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
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
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.message || 'Failed to update profile information.');
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
      // 1. Verify current password
      await verifyPassword(user.email, currentPassword);

      // 2. Update password
      await updatePassword(newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwSuccess('Password changed successfully! Please use your new password next time you log in.');
      toast('Password updated successfully!');
    } catch (err) {
      console.error('Update password error:', err);
      setPwError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="g-page" style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, fontWeight: 600, color: 'var(--accent-text)',
          background: 'rgba(99,102,241,0.12)', padding: '4px 10px',
          borderRadius: 'var(--r-pill)', marginBottom: 8
        }}>
          <ShieldCheck size={13} />
          <span>Security &amp; Account Settings</span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--txt-primary)', margin: 0, letterSpacing: '-0.02em' }}>
          Teacher Settings
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--txt-secondary)', margin: '4px 0 0' }}>
          Manage your login credentials, email address, password, and teacher profile
        </p>
      </div>

      {/* Account Profile Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px 28px',
          borderRadius: 'var(--r-xl)',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(238,242,255,0.45) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: 'var(--accent-text)',
            boxShadow: '0 4px 14px rgba(99,102,241,0.15)'
          }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--txt-primary)' }}>
                {user?.firstName} {user?.lastName}
              </span>
              <span className="g-chip" style={{
                background: 'rgba(99,102,241,0.12)', color: 'var(--accent-text)',
                borderColor: 'rgba(99,102,241,0.25)', fontWeight: 600, fontSize: 11
              }}>
                Teacher Account
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--txt-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} style={{ color: 'var(--txt-tertiary)' }} />
              <span>{user?.email}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--txt-tertiary)', textAlign: 'right' }}>
          <div>Role: <strong>Instructor / Educator</strong></div>
          <div style={{ marginTop: 2 }}>Status: <span style={{ color: '#059669', fontWeight: 600 }}>Active Verified</span></div>
        </div>
      </div>

      {/* Tabs: Security (Password & Email) vs Profile Details */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.45)',
        marginBottom: 24,
      }}>
        <button
          className={`g-tab-underline${activeTab === 'security' ? ' active' : ''}`}
          onClick={() => setActiveTab('security')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <KeyRound size={15} />
          <span>Email &amp; Password</span>
        </button>
        <button
          className={`g-tab-underline${activeTab === 'profile' ? ' active' : ''}`}
          onClick={() => setActiveTab('profile')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <User size={15} />
          <span>Profile Details</span>
        </button>
      </div>

      {/* ── TAB 1: SECURITY (EMAIL & PASSWORD) ── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card: Change Email */}
          <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-text)',
              }}>
                <Mail size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                  Change Email Address
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
                  Update the primary email used for login and notifications
                </p>
              </div>
            </div>

            {/* Current Email display */}
            <div style={{
              background: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.55)',
              borderRadius: 'var(--r-md)', padding: '12px 16px', margin: '18px 0 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Email
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt-primary)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
              <span className="g-chip" style={{ fontSize: 11, color: '#059669', borderColor: 'rgba(5,150,105,0.25)', background: 'rgba(5,150,105,0.08)' }}>
                ✓ Current Active
              </span>
            </div>

            {emailError && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: 16,
                background: 'rgba(254,242,242,0.85)', border: '1px solid rgba(248,113,113,0.40)',
                color: '#991b1b', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: 16,
                background: 'rgba(240,253,244,0.85)', border: '1px solid rgba(187,247,208,0.60)',
                color: '#065f46', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{emailSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangeEmail}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>New Email Address</label>
                  <input
                    style={inputStyle}
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="new.email@school.edu"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={emailSaving}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Current Password (to verify)</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 38 }}
                      type={showEmailPw ? 'text' : 'password'}
                      value={emailCurrentPassword}
                      onChange={e => setEmailCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      disabled={emailSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPw(!showEmailPw)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', padding: 4
                      }}
                      tabIndex={-1}
                    >
                      {showEmailPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <span style={{ fontSize: 11.5, color: 'var(--txt-tertiary)' }}>
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
                      <Loader2 size={14} className="animate-spin" />
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

          {/* Card: Change Password */}
          <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-text)',
              }}>
                <Lock size={16} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                  Change Password
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
                  Ensure your account is using a strong, unique password
                </p>
              </div>
            </div>

            {pwError && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-sm)', margin: '18px 0 16px',
                background: 'rgba(254,242,242,0.85)', border: '1px solid rgba(248,113,113,0.40)',
                color: '#991b1b', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{pwError}</span>
              </div>
            )}

            {pwSuccess && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r-sm)', margin: '18px 0 16px',
                background: 'rgba(240,253,244,0.85)', border: '1px solid rgba(187,247,208,0.60)',
                color: '#065f46', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                <span>{pwSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ marginTop: 18 }}>
              {/* Current Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...inputStyle, paddingRight: 38 }}
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={pwSaving}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', padding: 4
                    }}
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password & Confirm Password */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 38 }}
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      disabled={pwSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', padding: 4
                      }}
                      tabIndex={-1}
                    >
                      {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ ...inputStyle, paddingRight: 38 }}
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      disabled={pwSaving}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', color: 'var(--txt-tertiary)', cursor: 'pointer', padding: 4
                      }}
                      tabIndex={-1}
                    >
                      {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password checks indicator */}
              <div style={{
                background: 'rgba(255,255,255,0.30)', border: '1px solid rgba(255,255,255,0.50)',
                borderRadius: 'var(--r-sm)', padding: '10px 14px', marginBottom: 20,
                display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11.5
              }}>
                <span style={{
                  color: newPassword.length >= 6 ? '#059669' : 'var(--txt-secondary)',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500
                }}>
                  {newPassword.length >= 6 ? <Check size={13} strokeWidth={2.5} /> : '•'} At least 6 characters
                </span>
                <span style={{
                  color: newPassword && newPassword === confirmPassword ? '#059669' : 'var(--txt-secondary)',
                  display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500
                }}>
                  {newPassword && newPassword === confirmPassword ? <Check size={13} strokeWidth={2.5} /> : '•'} Passwords match
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={pwSaving || !currentPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="g-btn g-btn-primary"
                  style={{ minWidth: 150 }}
                >
                  {pwSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving…</span>
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

      {/* ── TAB 2: PROFILE DETAILS ── */}
      {activeTab === 'profile' && (
        <div className="glass-section" style={{ borderRadius: 'var(--r-xl)', padding: '26px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--accent-text)',
            }}>
              <User size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt-primary)', margin: 0 }}>
                Personal Information
              </h2>
              <p style={{ fontSize: 12.5, color: 'var(--txt-secondary)', margin: '2px 0 0' }}>
                Update your display name visible to your students
              </p>
            </div>
          </div>

          {profileError && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: 16,
              background: 'rgba(254,242,242,0.85)', border: '1px solid rgba(248,113,113,0.40)',
              color: '#991b1b', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--r-sm)', marginBottom: 16,
              background: 'rgba(240,253,244,0.85)', border: '1px solid rgba(187,247,208,0.60)',
              color: '#065f46', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>Profile information updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={labelStyle}>First Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Sarah"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  disabled={profileSaving}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Last Name</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Mitchell"
                  onFocus={handleFocus}
                  onBlur={handleBlur}
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
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Name</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
