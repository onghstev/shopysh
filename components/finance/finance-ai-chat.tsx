'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'What were my top expenses last month?',
  'How is my cash position looking?',
  'Which accounts have the highest balances?',
  'Explain the difference between debit and credit here',
];

export default function FinanceAIChat() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape' && open) setOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      const res  = await fetch('/api/finance/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer ?? 'No answer returned.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not connect to the AI service right now.' }]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Trigger button — sits above QuickEntry */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-[hsl(40_78%_47%)] text-white shadow-lg hover:opacity-90 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Ask AI about your finances"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[hsl(40_78%_47%)]" />
                <h2 className="font-semibold text-base">Finance AI</h2>
                <span className="text-xs text-muted-foreground">Ask anything about your accounts</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center py-2">Ask me about your GL accounts, balances, expenses, or anything in your books.</p>
                  <div className="space-y-2">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => send(s)}
                        className="w-full text-left text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t shrink-0">
              <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask about your finances…"
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
