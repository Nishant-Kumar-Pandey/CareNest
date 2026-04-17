import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata = {
  title: { default: 'CareNest — Trusted Elderly Care & Nursing', template: '%s | CareNest' },
  description: 'Connect your loved ones with verified, compassionate caregivers. Professional elderly nursing and healthcare assistance, on your schedule.',
  keywords: ['elderly care', 'nursing', 'caregiver', 'home health aide', 'senior care', 'dementia care'],
  openGraph: {
    title: 'CareNest — Trusted Elderly Care & Nursing',
    description: 'Connect your loved ones with verified, compassionate caregivers.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: 'var(--sage-700)', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: 'var(--terracotta-600)', secondary: 'white' },
            }
          }} 
        />
      </body>
    </html>
  );
}
