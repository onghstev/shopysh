'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WidgetPreviewPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams?.get('tenantId') || '';
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tenantId || loaded) return;
    // Dynamically load widget script
    const existing = document.querySelector('script[data-tekhuna-widget]');
    if (existing) existing.remove();
    // Reset widget state
    (window as any).__tekhunaWidget = false;

    const script = document.createElement('script');
    script.src = `${window.location.origin}/widget/tekhuna-chat.js`;
    script.setAttribute('data-tenant-id', tenantId);
    script.setAttribute('data-tekhuna-widget', 'true');
    script.async = true;
    document.body.appendChild(script);
    setLoaded(true);
  }, [tenantId, loaded]);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>Your Website Goes Here</h2>
        <p style={{ fontSize: '14px', color: '#64748b' }}>Click the chat button below to test your widget</p>
        <div style={{ marginTop: '24px', fontSize: '32px' }}>↓</div>
      </div>
    </div>
  );
}
