
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Acordes | Harmona',
  description: 'Editor musical para acordes avançados e cifras reais.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}