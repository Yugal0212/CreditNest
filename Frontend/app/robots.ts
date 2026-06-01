import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://creditnest.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/', 
        '/dashboard/*', 
        '/api/', 
        '/api/*'
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
