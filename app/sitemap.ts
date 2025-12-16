import { MetadataRoute } from 'next';
import { portfoliodata } from '@/components/portfolioData';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://baladev.in'; // Updated to the domain from portfolioData

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        // Add other routes here if you have multiple distinct pages accessible via URL
    ];
}
