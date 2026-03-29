import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'שירי ילדים | Hebrew Kids Songs',
  description: 'A weekly playlist of Hebrew children\'s songs based on the Jewish calendar',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-[family-name:var(--font-heebo)] antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
