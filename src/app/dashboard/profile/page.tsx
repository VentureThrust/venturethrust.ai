'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Eye, EyeOff, CheckCircle2, AlertCircle, User, Camera, Loader2, Lock } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type StatusState = { type: 'success' | 'error'; message: string } | null;

/** Resize an image file to a small square-ish thumbnail and return a JPEG data
 *  URL. Keeps avatars tiny so they fit comfortably in auth user_metadata. */
function resizeImage(file: File, max = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas unsupported'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Bad image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [nameSaving, setNameSaving] = useState(false);
  const [nameStatus, setNameStatus] = useState<StatusState>(null);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<StatusState>(null);

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const meta = (user.user_metadata ?? {}) as { full_name?: string; avatar_url?: string };
      setName(typeof meta.full_name === 'string' ? meta.full_name : '');
      setAvatarUrl(typeof meta.avatar_url === 'string' ? meta.avatar_url : '');
    })();
  }, []);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAvatarSaving(true);
    setAvatarStatus(null);
    try {
      const dataUrl = await resizeImage(file, 160);
      const { error } = await supabase.auth.updateUser({ data: { avatar_url: dataUrl } });
      if (error) throw error;
      setAvatarUrl(dataUrl);
      setAvatarStatus({ type: 'success', message: 'Photo updated.' });
    } catch {
      setAvatarStatus({ type: 'error', message: 'Could not update photo. Please try a smaller image.' });
    } finally {
      setAvatarSaving(false);
      e.target.value = '';
    }
  }

  async function handleNameSave(e: React.FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
      if (error) throw error;
      setNameStatus({ type: 'success', message: 'Name updated.' });
    } catch {
      setNameStatus({ type: 'error', message: 'Could not save your name.' });
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordStatus(null);
    if (!newPassword || !confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Both fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  }

  if (!mounted) return null;

  const initial = (name.trim()[0] || email[0] || 'U').toUpperCase();
  const inputBase =
    'h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 text-sm text-gray-900 outline-none transition focus:border-[#4285F4] focus:ring-2 focus:ring-[#4285F4]/20';
  const Status = ({ s }: { s: StatusState }) =>
    s ? (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${
          s.type === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}
      >
        {s.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        {s.message}
      </span>
    ) : null;

  return (
    <div className="mx-auto w-full max-w-3xl pb-12">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Settings</h1>

      {/* Tabs */}
      <div className="mt-5 flex gap-6 border-b border-gray-200">
        {(['profile', 'security'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition-colors ${
              activeTab === t
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="mt-6 space-y-5">
          {/* Profile photo */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Profile photo</h2>
            <p className="mt-0.5 text-sm text-gray-500">Displayed on your profile and across the platform.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-gray-200 bg-gray-100 text-xl font-semibold text-gray-500">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="avatar-input"
                  className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {avatarSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  Change photo
                </label>
                <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                <p className="mt-1.5 text-xs text-gray-400">PNG or JPG. It is resized automatically.</p>
                <div className="mt-2"><Status s={avatarStatus} /></div>
              </div>
            </div>
          </section>

          {/* Display name */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Display name</h2>
            <p className="mt-0.5 text-sm text-gray-500">The name shown across your workspace.</p>
            <form onSubmit={handleNameSave} className="mt-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={`${inputBase} max-w-sm`}
                maxLength={80}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={nameSaving}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4285F4] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {nameSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
                <Status s={nameStatus} />
              </div>
            </form>
          </section>

          {/* Email (read-only) */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Email address</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Your login email. For security this cannot be changed here. Contact support if you need to update it.
            </p>
            <div className="relative mt-4 max-w-sm">
              <input
                value={email}
                readOnly
                disabled
                className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3.5 pr-10 text-sm text-gray-500"
              />
              <Lock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </section>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="mt-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-gray-900">Change password</h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Use at least 8 characters. The change takes effect on your next sign-in.
            </p>
            <form onSubmit={handlePasswordSave} autoComplete="off" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">New password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      className={`${inputBase} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className={`${inputBase} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#4285F4] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Update password
                </button>
                <Status s={passwordStatus} />
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
