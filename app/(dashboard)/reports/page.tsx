'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileSpreadsheet, ShoppingCart, Package, Users, CreditCard, Loader2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const ALL_REPORT_TYPES = [
  { value: 'orders',    label: 'Orders Report',        icon: ShoppingCart, requires: 'ecommerce', description: 'Export all orders with customer details, items, status, and totals',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
  { value: 'products',  label: 'Product Inventory',    icon: Package,      requires: 'inventory', description: 'Export product catalog with pricing, stock levels, and categories',       color: 'text-green-600 bg-green-50 dark:bg-green-950' },
  { value: 'customers', label: 'Customer Database',    icon: Users,        requires: 'crm',       description: 'Export customer records with contact info, segments, and lifetime value', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
  { value: 'payments',  label: 'Payment Transactions', icon: CreditCard,   requires: 'ecommerce', description: 'Export payment records with gateway info, amounts, and statuses',         color: 'text-orange-600 bg-orange-50 dark:bg-orange-950' },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modules, setModules] = useState<string[]>(['ecommerce', 'finance', 'inventory', 'crm', 'marketing', 'communication']);

  useEffect(() => {
    fetch('/api/me/features').then(r => r.ok ? r.json() : null).then(d => { if (d?.modules) setModules(d.modules); }).catch(() => {});
  }, []);

  const REPORT_TYPES = ALL_REPORT_TYPES.filter(r => modules.includes(r.requires));

  const downloadReport = async (type: string) => {
    setDownloading(type);
    try {
      const params = new URLSearchParams({ type });
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error ?? 'Failed to generate report');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace('"', '') ?? `${type}-export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports & Export</h1>
        <p className="text-muted-foreground text-sm mt-1">Download your business data as CSV files for analysis and record keeping</p>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Date Range (optional — applies to Orders & Payments)</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORT_TYPES.map(report => (
          <Card key={report.value} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <report.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{report.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                  <Button
                    className="mt-4 gap-2"
                    variant="outline"
                    onClick={() => downloadReport(report.value)}
                    disabled={downloading === report.value}
                  >
                    {downloading === report.value ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">About CSV Exports</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSV files can be opened in Microsoft Excel, Google Sheets, or any spreadsheet application.
                Reports include up to 5,000 records per export. For larger datasets, use date filters to break the export into smaller ranges.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
