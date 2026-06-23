'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code, Copy, CheckCircle2, ExternalLink, Palette, Globe,
  MessageSquare, Zap, Users, ArrowRight, Eye, Settings,
  Smartphone, Monitor, Info,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChatWidgetPage() {
  const { data: session } = useSession() || {};
  const [tab, setTab] = useState('setup');
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const tenantId = (session?.user as any)?.tenantId || '';
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const embedCode = origin ? `<!-- Shopysh Chat Widget -->\n<script src="${origin}/widget/tekhuna-chat.js" data-tenant-id="${tenantId}"></script>` : '';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Embed code copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">Chat Widget</h1>
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">Live</Badge>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Add a live chat to any website &mdash; your customers chat directly with you and your AI assistant
        </p>
      </div>

      {/* Value Proposition */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Zero Setup for Tenants</p>
                <p className="text-xs text-muted-foreground mt-0.5">No complex API setup needed. Just copy one line of code.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI-Powered Replies</p>
                <p className="text-xs text-muted-foreground mt-0.5">Your AI assistant replies instantly to customer questions, 24/7.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Full CRM Integration</p>
                <p className="text-xs text-muted-foreground mt-0.5">Every chat creates a customer record, shows in Conversations, and feeds Analytics.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="setup" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Code className="w-4 h-4" /><span>Setup &amp; Embed</span>
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5 rounded-lg data-[state=active]:shadow-sm">
            <Eye className="w-4 h-4" /><span>Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="mt-6 space-y-6">
          {/* Step 1: Embed Code */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <CardTitle className="text-lg">Copy the Embed Code</CardTitle>
                  <CardDescription>Add this single line of code to your website, just before the closing &lt;/body&gt; tag</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm overflow-x-auto font-mono leading-relaxed">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  size="sm"
                  onClick={copyEmbed}
                  className="absolute top-3 right-3 h-8 text-xs"
                  variant={copied ? 'default' : 'secondary'}
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5" /> Works with any website
                </p>
                <p>Shopify, WordPress, Wix, Squarespace, custom HTML &mdash; just paste the code and you&apos;re live.</p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Customize */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <CardTitle className="text-lg">Customize Your Widget</CardTitle>
                  <CardDescription>The widget automatically uses your business settings</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Brand Colors</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Set in Settings &rarr; Profile &rarr; Primary Color</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Greeting Message</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Set in Settings &rarr; AI &rarr; Welcome Message</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Business Name & Logo</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Set in Settings &rarr; Profile</p>
                </div>
                <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">AI Personality & Tone</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Set in Settings &rarr; AI &rarr; Personality</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: How it works */}
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                  <CardDescription>Everything happens automatically</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { step: 'Customer visits your website', desc: 'They see a chat button in the bottom-right corner' },
                  { step: 'Customer sends a message', desc: 'A conversation is created and the AI assistant replies instantly' },
                  { step: 'You see the conversation in your dashboard', desc: 'Go to Conversations to view, reply, or take over from the AI' },
                  { step: 'Customer data is saved automatically', desc: 'Name, messages, and activity are tracked in your CRM' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.step}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="mt-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Live Preview</CardTitle>
                  <CardDescription>This is how the chat widget looks on your website</CardDescription>
                </div>
                <div className="flex gap-1 bg-muted rounded-lg p-1">
                  <Button
                    size="sm"
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('desktop')}
                    className="h-7 text-xs px-3"
                  >
                    <Monitor className="w-3.5 h-3.5 mr-1" /> Desktop
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    onClick={() => setPreviewMode('mobile')}
                    className="h-7 text-xs px-3"
                  >
                    <Smartphone className="w-3.5 h-3.5 mr-1" /> Mobile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`mx-auto border rounded-xl overflow-hidden bg-gray-50 relative ${
                  previewMode === 'mobile' ? 'max-w-[400px]' : 'max-w-full'
                }`}
                style={{ height: previewMode === 'mobile' ? '700px' : '550px' }}
              >
                {tenantId ? (
                  <iframe
                    src={`${origin}/widget-preview?tenantId=${tenantId}`}
                    className="w-full h-full border-0"
                    title="Chat Widget Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Loading preview...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
