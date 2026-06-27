'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Building2, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  code: string;
  phone?: string;
  email?: string;
}

interface Props {
  value: string; // vendorId
  onChange: (vendorId: string, vendorName: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function VendorLookup({ value, onChange, onClear, placeholder = 'Search vendors by name, code, or phone…' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [isSundry, setIsSundry] = useState(false);

  // Inline create form state
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/vendors?search=${encodeURIComponent(term)}&limit=8`);
      const data = await res.json();
      setResults(data.vendors ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { search(query); }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, search]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreate(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (v: Vendor) => {
    const displayName = v.code ? `[${v.code}] ${v.name}` : v.name;
    setSelectedName(displayName);
    setIsSundry(false);
    setOpen(false);
    setShowCreate(false);
    setQuery('');
    onChange(v.id, v.name);
  };

  const handleSundry = () => {
    setSelectedName('Sundry Vendor');
    setIsSundry(true);
    setOpen(false);
    setShowCreate(false);
    setQuery('');
    onChange('', 'Sundry Vendor');
  };

  const handleClear = () => {
    setSelectedName('');
    setIsSundry(false);
    setQuery('');
    onClear();
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/finance/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          paymentTerms: 'NET_30',
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Vendor created');
      handleSelect(data.vendor);
      setNewName(''); setNewPhone(''); setNewEmail('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  // If a vendor is already selected, show the chip
  if (value || isSundry) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
          isSundry
            ? 'border-border bg-muted/40 text-muted-foreground'
            : 'border-primary/40 bg-primary/5 text-foreground'
        }`}
      >
        <Building2
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: isSundry ? undefined : 'hsl(168 84% 26%)' }}
        />
        <span className="flex-1 truncate font-medium">{selectedName}</span>
        <button
          type="button"
          onClick={handleClear}
          className="p-0.5 rounded hover:bg-muted/60 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="h-9 rounded-xl pl-8"
        />
      </div>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="py-3 px-4 text-xs text-muted-foreground">Searching…</div>
            ) : results.length === 0 && query.trim() !== '' ? (
              <div className="py-3 px-4 text-xs text-muted-foreground">No vendors found</div>
            ) : (
              results.map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v)}
                  className="w-full flex items-start gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
                >
                  <Building2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {v.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">{v.code}</span>
                      )}
                      <p className="text-sm font-medium truncate">{v.name}</p>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {v.phone ? v.phone : ''}{v.email ? ` · ${v.email}` : ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Sundry vendor option */}
          <div className="border-t border-border/60">
            <button
              type="button"
              onClick={handleSundry}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
            >
              <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground italic">Sundry Vendor</span>
            </button>

            {/* New vendor toggle */}
            <button
              type="button"
              onClick={() => setShowCreate(s => !s)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(168 84% 26%)' }} />
              <span className="text-sm font-medium" style={{ color: 'hsl(168 84% 26%)' }}>New Vendor</span>
            </button>

            {showCreate && (
              <div className="px-4 pb-3 space-y-2 border-t border-border/60 pt-3">
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Name *"
                  className="h-8 rounded-lg text-sm"
                />
                <Input
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Phone *"
                  className="h-8 rounded-lg text-sm"
                />
                <Input
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="h-8 rounded-lg text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 h-8 text-xs"
                  >
                    {creating ? 'Saving…' : 'Create & Select'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
