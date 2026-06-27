'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, UserCheck, UserX, X, Plus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name?: string;
  phone: string;
  email?: string;
}

interface Props {
  value: string; // customerId
  onChange: (customerId: string, customerName: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function CustomerLookup({ value, onChange, onClear, placeholder = 'Search by name, phone, or email…' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
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
      const res = await fetch(`/api/finance/customers?search=${encodeURIComponent(term)}&limit=8`);
      const data = await res.json();
      setResults(data.customers ?? []);
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

  const handleSelect = (c: Customer) => {
    const name = c.name || c.phone;
    setSelectedName(name);
    setIsSundry(false);
    setOpen(false);
    setShowCreate(false);
    setQuery('');
    onChange(c.id, name);
  };

  const handleSundry = () => {
    setSelectedName('Sundry Customer');
    setIsSundry(true);
    setOpen(false);
    setShowCreate(false);
    setQuery('');
    onChange('', 'Sundry Customer');
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
      const res = await fetch('/api/finance/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success('Customer created');
      handleSelect(data.customer);
      setNewName(''); setNewPhone(''); setNewEmail('');
      setShowCreate(false);
    } finally {
      setCreating(false);
    }
  };

  // If a customer is already selected, show the chip
  if (value || isSundry) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${
          isSundry
            ? 'border-border bg-muted/40 text-muted-foreground'
            : 'border-primary/40 bg-primary/5 text-foreground'
        }`}
      >
        {isSundry ? (
          <UserX className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <UserCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(168 84% 26%)' }} />
        )}
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
              <div className="py-3 px-4 text-xs text-muted-foreground">No customers found</div>
            ) : (
              results.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full flex items-start gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
                >
                  <UserCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name || c.phone}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.phone}{c.email ? ` · ${c.email}` : ''}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Sundry customer option */}
          <div className="border-t border-border/60">
            <button
              type="button"
              onClick={handleSundry}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
            >
              <UserX className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground italic">Sundry Customer</span>
            </button>

            {/* New customer toggle */}
            <button
              type="button"
              onClick={() => setShowCreate(s => !s)}
              className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/50 transition-colors text-left"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(168 84% 26%)' }} />
              <span className="text-sm font-medium" style={{ color: 'hsl(168 84% 26%)' }}>New Customer</span>
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
