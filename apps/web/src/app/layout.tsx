import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { BranchProvider } from '../contexts/BranchContext';
import { LocaleProvider } from '../contexts/LocaleContext';
import { CartProvider } from '../contexts/CartContext';
import { AuthProvider } from '../contexts/AuthContext';
import { AuthModal } from '../components/ui/AuthModal';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import './globals.css';

// Crucial: Load cyrillic and cyrillic-ext for complete Kazakh alphabet support (Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ)
const inter = Inter({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Индийский Трикотаж | Үнді Трикотажы — Алматы',
  description:
    'Сеть розничных магазинов качественного трикотажа в Алматы. 16 филиалов в ТРЦ, быстрая доставка и оплата через Kaspi Pay.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans flex flex-col">
        <LocaleProvider>
          <BranchProvider>
            <CartProvider>
              <AuthProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <AuthModal />
              </AuthProvider>
            </CartProvider>
          </BranchProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
