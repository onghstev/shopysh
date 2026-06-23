'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Send, User, Loader2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef?.current?.scrollTo?.({ top: scrollRef?.current?.scrollHeight ?? 0, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input?.trim?.() || streaming) return;
    const userMessage = input.trim();
    setInput('');
    setMessages((prev: ChatMessage[]) => [...(prev ?? []), { role: 'user', content: userMessage }]);
    setStreaming(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!res?.ok) {
        const errData = await res?.json?.().catch(() => ({}));
        setMessages((prev: ChatMessage[]) => [...(prev ?? []), { role: 'assistant', content: errData?.error ?? 'Failed to get AI response' }]);
        setStreaming(false);
        return;
      }

      const reader = res?.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      // Add empty assistant message
      setMessages((prev: ChatMessage[]) => [...(prev ?? []), { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line?.startsWith?.('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed?.choices?.[0]?.delta?.content ?? '';
              fullText += content;
              setMessages((prev: ChatMessage[]) => {
                const updated = [...(prev ?? [])];
                if (updated.length > 0) {
                  updated[updated.length - 1] = { role: 'assistant', content: fullText };
                }
                return updated;
              });
            } catch { /* skip */ }
          }
        }
      }
    } catch (error: any) {
      console.error('AI error:', error);
      setMessages((prev: ChatMessage[]) => [...(prev ?? []), { role: 'assistant', content: 'An error occurred. Please try again.' }]);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground text-sm mt-1">Test your business AI assistant</p>
      </div>

      <Card className="flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
        <CardHeader className="border-b py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" /> AI Chat Preview
          </CardTitle>
        </CardHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {(messages?.length ?? 0) === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Start a conversation to test your AI assistant</p>
              <p className="text-sm mt-1">Try asking about products, prices, or placing an order</p>
            </div>
          )}
          {(messages ?? []).map((msg: ChatMessage, i: number) => (
            <div key={i} className={`flex gap-3 ${msg?.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg?.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg?.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}>
                <p className="whitespace-pre-wrap">{msg?.content || (streaming && i === (messages?.length ?? 0) - 1 ? '...' : '')}</p>
              </div>
              {msg?.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t p-4">
          <form onSubmit={(e: React.FormEvent) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <Input
              placeholder="Type a message (e.g., 'What products do you have?')"
              value={input}
              onChange={(e: any) => setInput(e?.target?.value ?? '')}
              disabled={streaming}
              className="flex-1"
            />
            <Button type="submit" disabled={streaming || !input?.trim?.()}>
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
