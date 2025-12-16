import { MetadataRoute } from 'next';
import { personal as portfoliodata } from '@/components/data';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseurl = 'https://baladev.in';

    return [
        {
            url: baseurl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
    ];
}
