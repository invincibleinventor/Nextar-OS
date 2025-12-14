import type { Metadata, Viewport } from 'next';
import './globals.css';
import { WindowProvider } from '@/components/WindowContext';
import { ThemeProvider } from '@/components/ThemeContext';
import { DeviceProvider } from '@/components/DeviceContext';



export const metadata: Metadata = {
  title: 'Portfolio OS',
  description: 'A macOS-style portfolio',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Portfolio OS',
  },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <html className='bg-black' lang="en">
        <body className="font-sf w-screen h-screen overflow-hidden bg-black antialiased">
          <WindowProvider>
            <div className="fixed inset-0 bg-black bg-cover bg-no-repeat bg-[url('/bg.jpg')] dark:bg-[url('/bg-dark.jpg')] h-[100dvh] w-screen overflow-hidden transition-colors duration-500">
              {}
              <DeviceProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </DeviceProvider>
            </div>
          </WindowProvider>
        </body>
      </html>
    </ThemeProvider>
  );
}
