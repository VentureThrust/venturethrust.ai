'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
import { Eye, EyeOff, CheckCircle2, AlertCircle, User, Camera, Loader2 } from 'lucide-react';

type UserProfile = {
  id: string;
  email: string;
  avatar_url?: string;
};

type StatusState = { type: 'success' | 'error'; message: string } | null;

export default function ProfilePage() {

  const [profile, setProfile]           = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl]       = useState('');
  const [activeTab, setActiveTab]       = useState<'profile' | 'security'>('profile');
  const [mounted, setMounted]           = useState(false);

  // profile form
  const [email, setEmail]               = useState('');
  const [profileStatus, setProfileStatus] = useState<StatusState>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // password form
  const [showNew, setShowNew]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProfile();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', user.id)
      .single();

    const p: UserProfile = {
      id: user.id,
      email: data?.email || user.email || '',
    };
    setProfile(p);
    setEmail(p.email);
  }

  // ── Save email ──────────────────────────────────────────────────────────────
  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setProfileLoading(true);
    setProfileStatus(null);

    try {
      // 1. Update Supabase Auth email (sends confirmation email)
      const { error: authError } = await supabase.auth.updateUser({ email });
      if (authError) throw authError;

      // 2. Update profiles table email
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ email })
        .eq('id', profile.id);
      if (dbError) throw dbError;

      setProfile({ ...profile, email });
      setProfileStatus({ type: 'success', message: 'Saved! Check your inbox to confirm the new email.' });
    } catch (err: any) {
      setProfileStatus({ type: 'error', message: err.message || 'Failed to save.' });
    } finally {
      setProfileLoading(false);
    }
  }

  // ── Save password ───────────────────────────────────────────────────────────
  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Both fields are required.' }); return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 8 characters.' }); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' }); return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  // ── Avatar upload ───────────────────────────────────────────────────────────
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (!mounted) return null;

  const displayName = profile?.email?.split('@')[0] || '-';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Sora:wght@500;600&display=swap');

        .sp-wrap {
          width: 100%;
          min-height: 100vh;
          background: #fff;
          font-family: 'Inter', sans-serif;
          color: #111;
          display: flex;
          flex-direction: column;
          /* bleed out of any parent padding */
          margin: -32px -32px 0 -32px;
          padding: 0;
          box-sizing: border-box;
        }

        /* ── Tab bar ── */
        .sp-tabbar {
          display: flex;
          align-items: flex-end;
          padding: 0 0 0 48px;
          border-bottom: 1px solid #e8e8e8;
          gap: 0;
          flex-shrink: 0;
        }

        .sp-page-title {
          font-family: 'Sora', sans-serif;
          font-size: 1.35rem;
          font-weight: 600;
          color: #0a0a0a;
          letter-spacing: -0.02em;
          padding: 28px 0 20px;
          margin-right: 44px;
          white-space: nowrap;
        }

        .sp-tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-family: 'Inter', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          color: #9ca3af;
          padding: 28px 0 18px;
          margin-right: 32px;
          cursor: pointer;
          transition: color 0.14s, border-color 0.14s;
          white-space: nowrap;
        }
        .sp-tab:hover { color: #374151; }
        .sp-tab.active { color: #0a0a0a; border-bottom-color: #0a0a0a; }

        /* ── Body: left rail + right content ── */
        .sp-body {
          display: grid;
          grid-template-columns: 240px 1fr;
          flex: 1;
          min-height: 0;
        }

        /* Left rail */
        .sp-rail {
          border-right: 1px solid #e8e8e8;
          padding: 36px 20px;
        }

        .sp-rail-label {
          font-size: 0.67rem;
          font-weight: 600;
          letter-spacing: 0.11em;
          text-transform: uppercase;
          color: #c4c4c4;
          padding: 0 10px;
          margin-bottom: 8px;
          display: block;
        }

        .sp-rail-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          background: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.86rem;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          text-align: left;
          transition: all 0.14s;
        }
        .sp-rail-item:hover { background: #f5f5f5; color: #111; }
        .sp-rail-item.active { background: #f0f0f0; color: #0a0a0a; font-weight: 600; }

        /* Right content */
        .sp-content {
          display: flex;
          flex-direction: column;
        }

        /* Each settings section row */
        .sp-section {
          display: grid;
          grid-template-columns: 300px 1fr;
          border-bottom: 1px solid #e8e8e8;
        }
        .sp-section:last-child { border-bottom: none; }

        .sp-section-meta {
          padding: 40px 36px 40px 48px;
          border-right: 1px solid #e8e8e8;
        }

        .sp-section-title {
          font-family: 'Sora', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: #0a0a0a;
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }

        .sp-section-desc {
          font-size: 0.78rem;
          color: #9ca3af;
          line-height: 1.6;
        }

        .sp-section-body {
          padding: 40px 48px;
          display: flex;
          align-items: flex-start;
          gap: 28px;
        }

        /* Avatar */
        .av-ring {
          position: relative;
          flex-shrink: 0;
        }
        .av-circle {
          width: 68px;
          height: 68px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .av-circle img { width: 100%; height: 100%; object-fit: cover; }
        .av-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.17s;
          cursor: pointer;
        }
        .av-ring:hover .av-overlay { opacity: 1; }

        .av-info h3 {
          font-family: 'Sora', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #0a0a0a;
          margin: 0 0 3px;
          letter-spacing: -0.01em;
        }
        .av-info p { font-size: 0.78rem; color: #9ca3af; margin: 0 0 12px; }

        .btn-upload {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border: 1.5px solid #d1d5db;
          border-radius: 7px;
          background: none;
          font-family: 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.14s;
        }
        .btn-upload:hover { background: #f5f5f5; border-color: #9ca3af; }

        /* Form fields */
        .sp-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          width: 100%;
          max-width: 580px;
        }

        .sp-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .sp-label {
          font-size: 0.77rem;
          font-weight: 500;
          color: #374151;
        }

        .sp-input {
          height: 42px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          color: #111;
          background: #fafafa;
          outline: none;
          transition: all 0.15s;
          width: 100%;
          box-sizing: border-box;
        }
        .sp-input:focus { border-color: #111; background: #fff; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .sp-input::placeholder { color: #d1d5db; }

        .sp-input-wrap { position: relative; }
        .sp-input-wrap .sp-input { padding-right: 44px; }
        .sp-eye {
          position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #9ca3af;
          display: flex; align-items: center; padding: 0;
          transition: color 0.14s;
        }
        .sp-eye:hover { color: #374151; }

        .sp-hint { font-size: 0.72rem; color: #bbb; }

        /* Actions */
        .sp-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .btn-primary {
          height: 38px; padding: 0 20px;
          background: #0a0a0a; color: #fff;
          border: none; border-radius: 7px;
          font-size: 0.84rem; font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.14s;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-primary:hover { background: #222; }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-ghost {
          height: 38px; padding: 0 16px;
          background: transparent; color: #6b7280;
          border: 1.5px solid #e5e7eb; border-radius: 7px;
          font-size: 0.84rem; font-weight: 500;
          font-family: 'Inter', sans-serif;
          cursor: pointer; transition: all 0.14s;
        }
        .btn-ghost:hover { border-color: #9ca3af; color: #374151; background: #f9fafb; }

        .badge-ok {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.79rem; color: #059669; font-weight: 500;
          background: #ecfdf5; padding: 5px 12px; border-radius: 6px;
          border: 1px solid #bbf7d0;
        }
        .badge-err {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.79rem; color: #dc2626; font-weight: 500;
          background: #fef2f2; padding: 5px 12px; border-radius: 6px;
          border: 1px solid #fecaca;
        }
      `}</style>

      <div className="sp-wrap" suppressHydrationWarning>

        {/* Tab bar */}
        <div className="sp-tabbar">
          <span className="sp-page-title">Settings</span>
          <button suppressHydrationWarning className={`sp-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
          <button suppressHydrationWarning className={`sp-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>Security</button>
        </div>

        {/* Body */}
        <div className="sp-body">

          {/* Left rail */}
          <div className="sp-rail">
            <span className="sp-rail-label">Account</span>
            {activeTab === 'profile' && (
              <>
                <button suppressHydrationWarning className="sp-rail-item active"><User size={14} />Personal info</button>
                <button suppressHydrationWarning className="sp-rail-item"><Camera size={14} />Profile photo</button>
              </>
            )}
            {activeTab === 'security' && (
              <button suppressHydrationWarning className="sp-rail-item active"><Eye size={14} />Password</button>
            )}
          </div>

          {/* Right content */}
          <div className="sp-content">

            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <>
                {/* Avatar row */}
                <div className="sp-section">
                  <div className="sp-section-meta">
                    <div className="sp-section-title">Profile photo</div>
                    <div className="sp-section-desc">Displayed on your profile and across the platform.</div>
                  </div>
                  <div className="sp-section-body">
                    <div className="av-ring">
                      <div className="av-circle">
                        {avatarUrl ? <img src={avatarUrl} alt="avatar" /> : <User size={24} color="#d1d5db" />}
                      </div>
                      <label htmlFor="av-input" className="av-overlay"><Camera size={16} color="#fff" /></label>
                      <input id="av-input" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                    </div>
                    <div className="av-info">
                      <h3>{displayName}</h3>
                      <p>{profile?.email || 'No email set'}</p>
                      <label htmlFor="av-input" className="btn-upload"><Camera size={13} />Change photo</label>
                    </div>
                  </div>
                </div>

                {/* Email row */}
                <div className="sp-section">
                  <div className="sp-section-meta">
                    <div className="sp-section-title">Email address</div>
                    <div className="sp-section-desc">Update the email linked to your account. A confirmation will be sent to the new address.</div>
                  </div>
                  <div className="sp-section-body" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <form onSubmit={handleProfileSave} style={{ width: '100%' }}>
                      <div className="sp-fields" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="sp-field">
                          <label className="sp-label" htmlFor="email">Email address</label>
                          <input
                            id="email" type="email" className="sp-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                            style={{ maxWidth: 340 }}
                          />
                        </div>
                      </div>
                      <div className="sp-actions">
                        <button suppressHydrationWarning className="btn-primary" type="submit" disabled={profileLoading}>
                          {profileLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                          Save changes
                        </button>
                        <button suppressHydrationWarning className="btn-ghost" type="button" onClick={() => setEmail(profile?.email || '')}>Cancel</button>
                        {profileStatus && (
                          <span className={profileStatus.type === 'success' ? 'badge-ok' : 'badge-err'}>
                            {profileStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                            {profileStatus.message}
                          </span>
                        )}
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <div className="sp-section">
                <div className="sp-section-meta">
                  <div className="sp-section-title">Change password</div>
                  <div className="sp-section-desc">Use a strong password with at least 8 characters. Changes take effect immediately on all sessions.</div>
                </div>
                <div className="sp-section-body" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <form onSubmit={handlePasswordSave} autoComplete="off" style={{ width: '100%' }}>
                    <div className="sp-fields">
                      <div className="sp-field">
                        <label className="sp-label" htmlFor="newPw">New password</label>
                        <div className="sp-input-wrap">
                          <input
                            id="newPw" className="sp-input"
                            type={showNew ? 'text' : 'password'}
                            placeholder="Min. 8 characters"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                          />
                          <button suppressHydrationWarning type="button" className="sp-eye" onClick={() => setShowNew(v => !v)}>
                            {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <span className="sp-hint">Letters, numbers & symbols</span>
                      </div>
                      <div className="sp-field">
                        <label className="sp-label" htmlFor="confPw">Confirm password</label>
                        <div className="sp-input-wrap">
                          <input
                            id="confPw" className="sp-input"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                          />
                          <button suppressHydrationWarning type="button" className="sp-eye" onClick={() => setShowConfirm(v => !v)}>
                            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="sp-actions">
                      <button suppressHydrationWarning className="btn-primary" type="submit" disabled={passwordLoading}>
                        {passwordLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                        Update password
                      </button>
                      <button suppressHydrationWarning className="btn-ghost" type="button" onClick={() => { setNewPassword(''); setConfirmPassword(''); setPasswordStatus(null); }}>Cancel</button>
                      {passwordStatus && (
                        <span className={passwordStatus.type === 'success' ? 'badge-ok' : 'badge-err'}>
                          {passwordStatus.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
                          {passwordStatus.message}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}