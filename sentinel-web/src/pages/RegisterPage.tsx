import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { registerSchema } from '../validation/schemas';

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
    mode: 'onChange',
  });

  async function onSubmit(data: RegisterFormData) {
    setServerErrors([]);
    setBusy(true);
    try {
      await registerUser(data.fullName, data.email, data.password);
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerErrors(err.fieldMessages.length ? err.fieldMessages : [err.message]);
      } else {
        setServerErrors(['Could not create your account. Please try again.']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="mt-1 text-slate-600">
        An account lets you save drafts and see all your complaints. Prefer not to? You can also{' '}
        <Link to="/report" className="font-medium text-accent-700 hover:underline">report anonymously</Link>.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="card mt-6 space-y-4 p-6">
        {serverErrors.length > 0 && (
          <ul className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {serverErrors.map((msg, i) => <li key={`${msg}-${i}`}>{msg}</li>)}
          </ul>
        )}
        <div>
          <label htmlFor="fullName" className="label">Full name</label>
          <input id="fullName" type="text" autoComplete="name" className="input" {...register('fullName')} />
          {errors.fullName && <p className="error-text">{errors.fullName.message}</p>}
        </div>
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
              autoComplete="new-password"
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
          <p className="help">At least 10 characters, including a letter and a number.</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            to="/login"
            state={from ? { from } : undefined}
            className="font-medium text-accent-700 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
