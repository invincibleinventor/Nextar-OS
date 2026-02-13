import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
import { WindowProvider } from '@/components/WindowContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { DeviceProvider } from '@/components/DeviceContext';
import { SettingsProvider } from '@/components/SettingsContext';
import { FileSystemProvider } from '@/components/FileSystemContext';
import { AppPreferencesProvider } from '@/components/AppPreferencesContext';
import { AppMenuProvider } from '@/components/AppMenuContext';
import { ProcessProvider } from '@/components/ProcessContext';
import { PermissionsProvider } from '@/components/PermissionsContext';
import { ElectronProvider } from '@/components/ElectronContext';

export const metadata: Metadata = {
  title: {
    default: 'HackathOS',
    template: '%s | HackathOS',
  },
  description: 'Hackathon Operating Workspace — From idea to deploy in minutes.',
  applicationName: 'HackathOS',
  authors: [{ name: 'HackathOS' }],
  generator: 'Next.js',
  keywords: ['hackathon', 'workspace', 'IDE', 'Next.js', 'React', 'TypeScript', 'WebOS', 'developer tools'],
  referrer: 'origin-when-cross-origin',
  creator: 'HackathOS',
  publisher: 'HackathOS',
  openGraph: {
    title: 'HackathOS',
    description: 'Hackathon Operating Workspace — From idea to deploy in minutes.',
    siteName: 'HackathOS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HackathOS - Hackathon Workspace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackathOS',
    description: 'Hackathon Operating Workspace — From idea to deploy in minutes.',
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
    title: 'HackathOS',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HackathOS',
  description: 'Hackathon Operating Workspace — From idea to deploy in minutes.',
  applicationCategory: 'DeveloperApplication',
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
import { MusicProvider } from '@/components/MusicContext';
import { ProjectProvider } from '@/components/ProjectContext';
import { CheerpXProvider } from '@/components/CheerpXContext';
import { RuntimeProvider } from '@/components/RuntimeContext';
import PermissionDialog from '@/components/PermissionDialog';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <html className={`bg-black ${jetbrainsMono.variable}`} lang="en" suppressHydrationWarning>
        <head />
        <body className="font-mono w-screen h-screen overflow-hidden bg-black antialiased">
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  // UNREGISTER coi-serviceworker (it breaks CheerpX BYOB streams)
                  // Next.js headers in next.config.ts already handle COOP/COEP
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      if (registration.active && registration.active.scriptURL.includes('coi-serviceworker')) {
                        console.log('[HackathOS] Unregistering conflicting COI Service Worker');
                        registration.unregister();
                      }
                    }
                  });

                  // Only register our custom caching SW in production
                  if ('${process.env.NODE_ENV}' !== 'development') {
                    navigator.serviceWorker.register('/sw.js').catch(function() {});
                  }
                }
                window.addEventListener('unhandledrejection', function(e) {
                  if (e.reason && String(e.reason).includes('serviceWorker')) {
                    e.preventDefault();
                    return;
                  }
                  console.error('[HackathOS] Unhandled rejection:', e.reason);
                });
              `,
            }}
          />
          <WindowProvider>
            <div className="fixed inset-0 bg-black h-[100dvh] w-screen overflow-hidden transition-colors duration-500">

              <ElectronProvider>
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
                                    <MusicProvider>
                                      <CheerpXProvider>
                                        <RuntimeProvider>
                                          <ProjectProvider>
                                            {children}
                                            <PermissionDialog />
                                          </ProjectProvider>
                                        </RuntimeProvider>
                                      </CheerpXProvider>
                                    </MusicProvider>
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
              </ElectronProvider>
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
