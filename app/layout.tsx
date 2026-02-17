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
import { HostProvider } from '@/components/HostContext';

export const metadata: Metadata = {
  title: {
    default: 'NextarOS',
    template: '%s | NextarOS',
  },
  description: 'Your personal cloud OS. Deploy on your server, access from anywhere.',
  applicationName: 'NextarOS',
  authors: [{ name: 'NextarOS' }],
  generator: 'Next.js',
  keywords: ['cloud OS', 'personal cloud', 'self-hosted', 'web desktop', 'browser OS', 'server OS', 'Next.js', 'React', 'TypeScript'],
  referrer: 'origin-when-cross-origin',
  creator: 'NextarOS',
  publisher: 'NextarOS',
  openGraph: {
    title: 'NextarOS',
    description: 'Your personal cloud OS. Deploy on your server, access from anywhere.',
    siteName: 'NextarOS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NextarOS - Your personal cloud OS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextarOS',
    description: 'Your personal cloud OS. Deploy on your server, access from anywhere.',
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
    title: 'NextarOS',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NextarOS',
  description: 'Your personal cloud OS. Deploy on your server, access from anywhere.',
  applicationCategory: 'DesktopEnhancementApplication',
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
    <html className={`bg-black ${jetbrainsMono.variable}`} lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t){document.documentElement.classList.add(t)}else{document.documentElement.classList.add('dark')}}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      <body className="font-mono w-screen h-screen overflow-hidden bg-black antialiased" suppressHydrationWarning>
        <ThemeProvider>
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
                        console.log('[NextarOS] Unregistering conflicting COI Service Worker');
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
                  console.error('[NextarOS] Unhandled rejection:', e.reason);
                });
              `,
            }}
          />
          <WindowProvider>
            <div className="fixed inset-0 bg-black h-[100dvh] w-screen overflow-hidden transition-colors duration-500">

              <ElectronProvider>
                <HostProvider>
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
                </HostProvider>
              </ElectronProvider>
            </div>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
          </WindowProvider>
        </ThemeProvider>
        </body>
      </html>
  );
}
