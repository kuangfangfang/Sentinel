import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './Spinner';

/**
 * Client-side route guard. This is a CONVENIENCE only — the API enforces
 * authorisation independently on every request (SRS 6.2). It redirects
 * unauthenticated users to login and role-mismatched users away.
 */
export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role?: 'Caseworker' | 'Complainant';
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (role && !user.roles.includes(role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
