import type { Metadata } from 'next';
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { GoogleAnalytics } from '@/components/google-analytics';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000'),
  title: 'Shopysh',
  description: 'AI-powered Business Management for African SMEs. Manage products, orders, and customer conversations.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  openGraph: { images: ['/og-image.png'] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${dmSans.variable} ${jakarta.variable} ${jetbrains.variable} font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <ChunkLoadErrorHandler />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
