import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.shopysh.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/store/',
          '/pitch',
          '/guide',
        ],
        disallow: [
          '/api/',
          '/dashboard/',
          '/admin/',
          '/settings/',
          '/login',
          '/register',
          '/sandbox/',
        ],
      },
      {
        // Allow AI crawlers explicitly for AEO/GEO
        userAgent: ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'PerplexityBot', 'ClaudeBot'],
        allow: ['/store/', '/pitch', '/guide'],
        disallow: ['/api/', '/dashboard/', '/admin/'],
      },
      {
        // Block feed endpoints from general crawlers (Google Merchant Center fetches directly)
        userAgent: '*',
        disallow: ['/feeds/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
