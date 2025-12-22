import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WindowProvider } from '@/components/WindowContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { DeviceProvider } from '@/components/DeviceContext';
import { SettingsProvider } from '@/components/SettingsContext';
import { FileSystemProvider } from '@/components/FileSystemContext';
import { AppPreferencesProvider } from '@/components/AppPreferencesContext';
import { AppMenuProvider } from '@/components/AppMenuContext';
import { ProcessProvider } from '@/components/ProcessContext';
import { PermissionsProvider } from '@/components/PermissionsContext';

import { personal as portfoliodata } from '@/components/data';

export const metadata: Metadata = {
  title: {
    default: portfoliodata.personal.name,
    template: `%s | ${portfoliodata.personal.name}`,
  },
  description: portfoliodata.personal.bio,
  applicationName: 'BalaTBR - NextarOS',
  authors: [{ name: portfoliodata.personal.name, url: 'https://baladev.in' }],
  generator: 'Next.js',
  keywords: [...portfoliodata.skills, 'Next.js', 'React', 'TailwindCSS', 'Portfolio', 'macOS Web', 'System Simulator', 'WebOS'],
  referrer: 'origin-when-cross-origin',
  creator: portfoliodata.personal.name,
  publisher: portfoliodata.personal.name,
  metadataBase: new URL('https://baladev.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: portfoliodata.personal.name,
    description: portfoliodata.personal.bio,
    url: 'https://baladev.in',
    siteName: 'BalaTBR - NextarOS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${portfoliodata.personal.name} Portfolio`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: portfoliodata.personal.name,
    description: portfoliodata.personal.role,
    creator: '@invincibleinventor',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BalaTBR - NextarOS',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: portfoliodata.personal.name,
  url: 'https://baladev.in',
  sameAs: [
    portfoliodata.personal.socials.github,
    portfoliodata.personal.socials.linkedin,
    portfoliodata.personal.socials.threads,
  ],
  jobTitle: portfoliodata.personal.role,
  worksFor: {
    '@type': 'Organization',
    name: 'Self-Employed',
  },
  description: portfoliodata.personal.bio,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: 'black',
};

import { NotificationProvider } from '@/components/NotificationContext';
import { AuthProvider } from '@/components/AuthContext';
import { ExternalAppsProvider } from '@/components/ExternalAppsContext';
import PermissionDialog from '@/components/PermissionDialog';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <html className='bg-black' lang="en" suppressHydrationWarning>
        <head />
        <body className="font-sf w-screen h-screen overflow-hidden bg-black antialiased">
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' !== 'development') {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                }
                window.addEventListener('unhandledrejection', function(e) {
                  e.preventDefault();
                });
              `,
            }}
          />
          <WindowProvider>
            <div className="fixed inset-0 bg-black h-[100dvh] w-screen overflow-hidden transition-colors duration-500">

              <DeviceProvider>
                <AuthProvider>
                  <ProcessProvider>
                    <SettingsProvider>
                      <NotificationProvider>
                        <PermissionsProvider>
                          <FileSystemProvider>
                            <AppPreferencesProvider>
                              <AppMenuProvider>
                                <ExternalAppsProvider>
                                  {children}
                                  <PermissionDialog />
                                </ExternalAppsProvider>
                              </AppMenuProvider>
                            </AppPreferencesProvider>
                          </FileSystemProvider>
                        </PermissionsProvider>
                      </NotificationProvider>
                    </SettingsProvider>
                  </ProcessProvider>
                </AuthProvider>
              </DeviceProvider>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </WindowProvider>
        </body>
      </html>
    </ThemeProvider>
  );
}
