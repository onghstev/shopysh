'use client';

import { useEffect, useState } from 'react';

interface Props {
  title: string;
  subtitle?: string;
}

export function ReportPrintHeader({ title, subtitle }: Props) {
  const [tenant, setTenant] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.tenant) setTenant(d.tenant); })
      .catch(() => {});
  }, []);

  const addressParts = [
    tenant?.address,
    tenant?.city,
    tenant?.state,
    tenant?.country,
  ].filter(Boolean);

  return (
    <div className="hidden print:block text-center mb-6 border-b border-gray-300 pb-4">
      {tenant?.name && (
        <h1 className="text-xl font-bold text-gray-900">{tenant.name}</h1>
      )}
      {addressParts.length > 0 && (
        <p className="text-sm text-gray-600 mt-0.5">{addressParts.join(', ')}</p>
      )}
      {tenant?.phone && (
        <p className="text-sm text-gray-600">Tel: {tenant.phone}</p>
      )}
      <h2 className="text-base font-bold mt-3 text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}
