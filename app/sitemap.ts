import { MetadataRoute } from 'next';
import { portfoliodata } from '@/components/portfolioData';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://baladev.in'; 

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ];
}
