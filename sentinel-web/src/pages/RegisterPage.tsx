import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setBusy(true);
    try {
      await register(fullName, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldMessages.length ? err.fieldMessages : [err.message]);
      } else {
        setErrors(['Could not create your account. Please try again.']);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <p className="mt-1 text-slate-600">
        An account lets you save drafts and see all your complaints. Prefer not to? You can also
        {' '}<Link to="/report" className="font-medium text-accent-700 hover:underline">report anonymously</Link>.
      </p>

      <form onSubmit={handleSubmit} className="card mt-6 space-y-4 p-6" noValidate>
        {errors.length > 0 && (
          <ul className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {errors.map((msg, i) => <li key={i}>{msg}</li>)}
          </ul>
        )}
        <div>
          <label htmlFor="fullName" className="label">Full name</label>
          <input id="fullName" type="text" autoComplete="name" required className="input"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" required className="input"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <div className="relative">
            <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required
              className="input pr-16" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-sm font-medium text-accent-700 hover:text-accent-800"
              aria-pressed={showPassword} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p className="help">At least 10 characters, including a letter and a number.</p>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-slate-600">
          Already have an account? <Link to="/login" className="font-medium text-accent-700 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
