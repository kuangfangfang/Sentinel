import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authApi } from '../api/auth';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { changePasswordSchema } from '../validation/schemas';

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function formatRoles(roles: string[]): string {
  const labels: Record<string, string> = {
    Caseworker: 'Caseworker',
    Complainant: 'Complainant',
  };
  return roles.map((role) => labels[role] ?? role).join(', ');
}

export function AccountPage() {
  const { user } = useAuth();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
    mode: 'onChange',
  });

  if (!user) return null;

  async function onSubmit(data: ChangePasswordFormData) {
    setSuccess(null);
    setError(null);
    setBusy(true);
    try {
      const res = await authApi.changePassword(data.currentPassword, data.newPassword);
      reset();
      setSuccess(res.message);
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const messages = err.fieldMessages;
        setError(messages.length > 0 ? messages.join(' ') : err.message);
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not update your password.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="mt-1 text-slate-600">View your profile and update your password.</p>
      </div>

      <section className="card p-6">
        <h2 className="font-semibold text-navy-900">Profile</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">Full name</dt>
            <dd>{user.fullName}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Role</dt>
            <dd>{formatRoles(user.roles)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-slate-500">
          To change your name or email, contact your administrator.
        </p>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold text-navy-900">Change password</h2>
        <p className="mt-1 text-sm text-slate-600">
          Use at least 10 characters with a letter and a number.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          {success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
              {success}
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="label">Current password</label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="input pr-16"
                {...register('currentPassword')}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-accent-700 hover:text-accent-800"
                aria-pressed={showCurrentPassword}
                aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
              >
                {showCurrentPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.currentPassword && <p className="error-text">{errors.currentPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="newPassword" className="label">New password</label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="input pr-16"
                {...register('newPassword')}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-accent-700 hover:text-accent-800"
                aria-pressed={showNewPassword}
                aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.newPassword && <p className="error-text">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmNewPassword" className="label">Confirm new password</label>
            <input
              id="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              className="input"
              {...register('confirmNewPassword')}
            />
            {errors.confirmNewPassword && <p className="error-text">{errors.confirmNewPassword.message}</p>}
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
