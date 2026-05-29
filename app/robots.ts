import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://fluxconvert.com'; // Change this to your actual production domain

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/profile/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
