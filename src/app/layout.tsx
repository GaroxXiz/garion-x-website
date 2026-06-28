import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ChatProvider } from '../presentation/context/chat-context';
import '../app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GarionX - Cybernetic Analytical AI',
  description: 'Next-generation AI chat platform built with Clean Architecture.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('garionx_theme');
                  if (savedTheme && savedTheme !== 'dark' && savedTheme !== 'blue') {
                    document.documentElement.classList.add('theme-' + savedTheme);
                  }
                } catch (e) {
                  console.error('Failed to load theme:', e);
                }
              })()
            `,
          }}
        />
      </head>
      <body>
        <ChatProvider>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
