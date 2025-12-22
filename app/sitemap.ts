import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

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
