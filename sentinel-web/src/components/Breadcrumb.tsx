import { Link } from 'react-router-dom';

export type BreadcrumbItem = {
  label: string;
  to?: string;
  state?: unknown;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && (
                <span aria-hidden="true" className="text-sm text-slate-400">
                  /
                </span>
              )}
              {isLast || !item.to ? (
                <span aria-current="page" className="text-sm font-medium text-slate-900">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  state={item.state}
                  className="text-sm font-medium text-slate-600 hover:text-accent-700 hover:underline"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
