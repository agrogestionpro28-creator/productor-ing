import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Mi Campo',
  description: 'Dashboard del productor agropecuario',
  manifest: '/manifest.json',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
