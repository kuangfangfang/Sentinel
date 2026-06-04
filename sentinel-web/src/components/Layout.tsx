import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDoubleEscapeQuickExit } from '../hooks/useQuickExit';
import { DemoDisclaimerGate } from './DemoDisclaimerGate';
import { GoogleTranslate } from './GoogleTranslate';
import { QuickExitButton } from './QuickExitButton';

function navClass({ isActive }: { isActive: boolean }) {
  return [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-navy-800 text-white' : 'text-navy-100 hover:bg-navy-800/60 hover:text-white',
  ].join(' ');
}

export function Layout() {
  useDoubleEscapeQuickExit(); // double-Escape works on every page (FR-38)
  const { user, isCaseworker, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  // Role-aware menu: caseworkers see only their tools; lodging and public
  // tracking are complainant/public functions and are hidden from them.
  const links = isCaseworker ? (
    <>
      <NavLink to="/caseworker" end className={navClass} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
      <NavLink to="/caseworker/queue" className={navClass} onClick={() => setMenuOpen(false)}>Queue</NavLink>
    </>
  ) : (
    <>
      <NavLink to="/" end className={navClass} onClick={() => setMenuOpen(false)}>Home</NavLink>
      <NavLink to="/resources" className={navClass} onClick={() => setMenuOpen(false)}>Resources</NavLink>
      <NavLink to="/track" className={navClass} onClick={() => setMenuOpen(false)}>Track a complaint</NavLink>
      <NavLink to="/about" className={navClass} onClick={() => setMenuOpen(false)}>About</NavLink>
      {user && (
        <NavLink to="/dashboard" className={navClass} onClick={() => setMenuOpen(false)}>My complaints</NavLink>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <DemoDisclaimerGate />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-navy-900 focus:shadow">
        Skip to main content
      </a>

      <header className="sticky top-0 z-50 bg-navy-900 text-white">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-600 text-white" aria-hidden="true">S</span>
            Sentinel
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {links}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <GoogleTranslate />
            </div>
            <QuickExitButton />
            <div className="hidden items-center gap-2 lg:flex">
              {user ? (
                <>
                  <span className="text-sm text-navy-100">{user.fullName}</span>
                  <button type="button" onClick={handleLogout} className="btn-secondary">Sign out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-navy-100 hover:bg-navy-800/60">Sign in</Link>
                  <Link to="/register" className="btn-secondary">Create account</Link>
                </>
              )}
            </div>
            <button
              type="button"
              className="rounded-md p-2 text-navy-100 hover:bg-navy-800 lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="mobile-menu" className="container-page flex flex-col gap-1 pb-4 lg:hidden" aria-label="Mobile">
            {links}
            <div className="mt-2 flex flex-col gap-2 border-t border-navy-800 pt-3">
              <div className="sm:hidden">
                <GoogleTranslate />
              </div>
              {user ? (
                <button type="button" onClick={handleLogout} className="btn-secondary">Sign out ({user.fullName})</button>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary" onClick={() => setMenuOpen(false)}>Sign in</Link>
                  <Link to="/register" className="btn-primary" onClick={() => setMenuOpen(false)}>Create account</Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="container-page flex-1 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page flex flex-col gap-3 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl">
            Sentinel is an independent demonstration project. It is <strong>not</strong> affiliated with the
            Australian Human Rights Commission and does not provide legal advice.
          </p>
          <p className="shrink-0">Press <kbd className="rounded border border-slate-300 px-1">Esc</kbd> twice to leave quickly.</p>
        </div>
      </footer>
    </div>
  );
}
