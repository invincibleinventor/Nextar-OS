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
import { ElectronProvider } from '@/components/ElectronContext';
import '@/utils/tauri-bridge'; // Initialize Tauri bridge (sets window.electronAPI)
import { HostProvider } from '@/components/HostContext';

export const metadata: Metadata = {
  title: {
    default: 'Bala TBR - NextarOS',
    template: '%s | NextarOS',
  },
  description: 'My personal portfolio website - that doubles as your personal cloud OS! Deploy on your server, access from anywhere.',
  applicationName: 'NextarOS',
  authors: [{ name: 'Bala TBR' }],
  generator: 'Next.js',
  keywords: ['cloud OS', 'personal cloud', 'self-hosted', 'portfolio', 'web desktop', 'browser OS', 'server OS', 'Next.js', 'React', 'TypeScript'],
  referrer: 'origin-when-cross-origin',
  creator: 'Bala TBR',
  publisher: 'Bala TBR',
  openGraph: {
    title: 'NextarOS',
    description: 'My personal portfolio website - that doubles as your personal cloud OS! Deploy on your server, access from anywhere.',
    siteName: 'NextarOS',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'NextarOS - Bala TBR',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NextarOS',
    description: 'My personal portfolio website - that doubles as your personal cloud OS! Deploy on your server, access from anywhere.',
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
  description: 'My personal portfolio website - that doubles as your personal cloud OS! Deploy on your server, access from anywhere.',
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
import { SystemTrayProvider } from '@/components/SystemTray';
import { WorkspaceProvider } from '@/components/WorkspaceSwitcher';
import { GlobalMenuProvider } from '@/components/GlobalMenuBar';
import Script from 'next/script';
import { ConfigSync } from '@/components/ConfigSync';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className="bg-black" lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var isTauri='__TAURI__' in window;var t=localStorage.getItem('theme');if(t){document.documentElement.classList.add(t)}else{document.documentElement.classList.add('dark')}if(isTauri){document.documentElement.classList.add('clay')}else{var s=localStorage.getItem('nextaros-ui-style');if(s!=='classic'){document.documentElement.classList.add('clay')}}}catch(e){document.documentElement.classList.add('dark');document.documentElement.classList.add('clay')}})()`,
          }}
        />
      </head>
      <body className="w-screen h-screen overflow-hidden bg-black antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Script
            id="service-worker"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      if (registration.active && registration.active.scriptURL.includes('coi-serviceworker')) {
                        console.log('[NextarOS] Unregistering conflicting COI Service Worker');
                        registration.unregister();
                      }
                    }
                  });

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

              <ConfigSync />
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
                                            <SystemTrayProvider>
                                              <WorkspaceProvider>
                                                <GlobalMenuProvider>
                                                  {children}
                                                  <PermissionDialog />
                                                </GlobalMenuProvider>
                                              </WorkspaceProvider>
                                            </SystemTrayProvider>
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
