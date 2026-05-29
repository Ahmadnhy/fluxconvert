import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://fluxconvert.com'; // Change this to your actual production domain

  const routes = [
    '',
    '/word-to-pdf',
    '/jpg-to-pdf',
    '/pdf-to-word',
    '/pdf-to-jpg',
    '/merge-pdf',
    '/split-pdf',
    '/login',
    '/register',
    '/help-center',
    '/privacy',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));
}
