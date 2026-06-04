import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { loginSchema } from '../validation/schemas';

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);
    setBusy(true);
    try {
      const user = await login(data.email, data.password);
      const destination = from ?? (user.roles.includes('Caseworker') ? '/caseworker' : '/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-slate-600">Access your complaints and their status.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4 p-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</div>
        )}
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" {...register('email')} />
          {errors.email && <p className="error-text">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-16"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-accent-700 hover:text-accent-800"
              aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-slate-600">
          No account?{' '}
          <Link
            to="/register"
            state={from ? { from } : undefined}
            className="font-medium text-accent-700 hover:underline"
          >
            Create one
          </Link>
        </p>
      </form>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-navy-900">Demo accounts</p>
        <p className="mt-1">Complainant: <code>complainant@sentinel.local</code> / <code>Complainant#2026</code></p>
        <p>Caseworker: <code>caseworker@sentinel.local</code> / <code>Caseworker#2026</code></p>
      </div>
    </div>
  );
}
