import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Currency Exchange',
  description: 'Multi-currency wallet with exchange transactions',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
