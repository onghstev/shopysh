'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Send, User, ArrowLeft, Bot, Loader2,
  Globe, CheckCheck, Check, Search, Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRelativeTime } from '@/lib/format';

interface Message {
  id: string;
  direction: string;
  senderType: string;
  messageText: string | null;
  createdAt: string;
  deliveryStatus: string | null;
}

interface Conversation {
  id: string;
  channel: string;
  status: string;
  lastMessageAt: string | null;
  escalatedToHuman: boolean;
  intent: string | null;
  customer: { id: string; name: string | null; phone: string; email?: string | null };
  messages: Message[];
}

const CHANNEL_ICONS: Record<string, any> = {
  webchat: Globe,
};

const CHANNEL_COLORS: Record<string, string> = {
  webchat: 'bg-blue-500/10 text-blue-600 border-blue-200',
};

const CHANNEL_LABELS: Record<string, string> = {
  webchat: 'Web Chat',
};

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data?.conversations ?? []);
      }
    } catch (e: any) { console.error(e); } finally { setLoading(false); }
  }, []);

  const fetchConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (res.ok) {
        const data = await res.json();
        if (data?.conversation) setActiveConv(data.conversation);
      }
    } catch (e: any) { console.error(e); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  // Poll for new messages when viewing a conversation
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeConv?.id) {
      pollRef.current = setInterval(() => {
        fetchConversation(activeConv.id);
      }, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeConv?.id, fetchConversation]);

  const sendReply = async () => {
    if (!replyText.trim() || !activeConv?.id) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/conversations/${activeConv.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: replyText }),
      });
      if (res.ok) {
        setReplyText('');
        await fetchConversation(activeConv.id);
        await fetchConversations();
        toast.success('Reply sent!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err?.error || 'Failed to send reply');
      }
    } catch (e: any) { toast.error('Network error'); } finally { setReplying(false); }
  };

  // Filter conversations
  const filtered = conversations.filter((conv) => {
    if (channelFilter !== 'all' && conv.channel !== channelFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (conv.customer?.name || '').toLowerCase();
      const phone = (conv.customer?.phone || '').toLowerCase();
      if (!name.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Conversations</h1>
        <p className="text-muted-foreground text-sm mt-1">Customer conversations across all channels</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ minHeight: '600px' }}>
        {/* Conversation List */}
        <Card className="shadow-sm border-border/50 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-base">All Conversations</CardTitle>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* Channel Filter */}
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'webchat'].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    channelFilter === ch
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                  }`}
                >
                  {ch === 'all' ? 'All' : CHANNEL_LABELS[ch] || ch}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
                <p className="text-xs text-muted-foreground mt-1">Conversations will appear when customers start chatting</p>
              </div>
            ) : (
              <div className="overflow-y-auto" style={{ maxHeight: '480px' }}>
                {filtered.map((conv) => {
                  const lastMsg = conv.messages?.[0];
                  const ChannelIcon = CHANNEL_ICONS[conv.channel] || MessageSquare;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => fetchConversation(conv.id)}
                      className={`w-full text-left px-4 py-3 border-b border-border/30 hover:bg-muted/50 transition-colors ${
                        activeConv?.id === conv.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate">
                              {conv.customer?.name || conv.customer?.phone || 'Unknown'}
                            </p>
                            <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${CHANNEL_COLORS[conv.channel] || ''}`}>
                              {CHANNEL_LABELS[conv.channel] || conv.channel}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {lastMsg?.messageText || 'No messages'}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-muted-foreground">{formatRelativeTime(conv.lastMessageAt)}</p>
                          {conv.escalatedToHuman && (
                            <Badge variant="destructive" className="text-[9px] mt-1">Escalated</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="shadow-sm border-border/50 lg:col-span-2 flex flex-col">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Select a conversation</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Choose a conversation from the list to view messages and reply</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setActiveConv(null)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{activeConv.customer?.name || activeConv.customer?.phone}</p>
                    <Badge variant="outline" className={`text-[10px] ${CHANNEL_COLORS[activeConv.channel] || ''}`}>
                      {CHANNEL_LABELS[activeConv.channel] || activeConv.channel}
                    </Badge>
                    <Badge variant={activeConv.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                      {activeConv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeConv.customer?.phone}{activeConv.customer?.email ? ` • ${activeConv.customer.email}` : ''}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-muted/20" style={{ maxHeight: '420px' }}>
                {(activeConv.messages || []).map((msg) => {
                  const isInbound = msg.direction === 'inbound';
                  return (
                    <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isInbound
                          ? 'bg-white border border-border/50 shadow-sm rounded-bl-md'
                          : msg.senderType === 'ai'
                            ? 'bg-violet-50 border border-violet-200 text-violet-900 rounded-br-md'
                            : 'bg-primary text-primary-foreground rounded-br-md'
                      }`}>
                        {!isInbound && msg.senderType === 'ai' && (
                          <div className="flex items-center gap-1 mb-1">
                            <Bot className="w-3 h-3 text-violet-500" />
                            <span className="text-[10px] text-violet-500 font-medium">AI Assistant</span>
                          </div>
                        )}
                        {!isInbound && msg.senderType === 'agent' && (
                          <div className="flex items-center gap-1 mb-1">
                            <User className="w-3 h-3 opacity-60" />
                            <span className="text-[10px] opacity-60 font-medium">You</span>
                          </div>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.messageText}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className={`text-[10px] ${isInbound ? 'text-muted-foreground' : 'opacity-60'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isInbound && (
                            msg.deliveryStatus === 'read' ? (
                              <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                            ) : msg.deliveryStatus === 'delivered' ? (
                              <CheckCheck className="w-3.5 h-3.5 opacity-60" />
                            ) : (
                              <Check className="w-3.5 h-3.5 opacity-60" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="px-5 py-3 border-t border-border/50">
                <div className="flex gap-2">
                  <Input
                    className="h-10 text-sm flex-1"
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e: any) => setReplyText(e.target.value)}
                    onKeyDown={(e: any) => e.key === 'Enter' && !e.shiftKey && !replying && sendReply()}
                  />
                  <Button onClick={sendReply} disabled={replying || !replyText.trim()} className="h-10 px-4">
                    {replying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Your reply will appear in the customer&apos;s chat widget in real-time</p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
