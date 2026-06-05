import type { ReactNode } from 'react';
import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

type CaseworkerPageHeaderProps = {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  children?: ReactNode;
};

export function CaseworkerPageHeader({ breadcrumbs, title, children }: CaseworkerPageHeaderProps) {
  return (
    <div className="space-y-1">
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      <h1 className="text-2xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
