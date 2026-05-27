import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-5xl font-bold text-navy-900">404</p>
      <h1 className="mt-4 text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="mt-2 text-slate-600">
        The page you were looking for doesn’t exist or may have moved.
      </p>
      <Link to="/" className="btn-primary mt-6">Go to the home page</Link>
    </div>
  );
}
