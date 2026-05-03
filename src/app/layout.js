import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/AuthProvider';
import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'SkillArena — Code. Compete. Win.',
  description: 'Real-time 1v1 coding battles with real money on the line.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a24',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#0a0a0f' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0f' } },
          }}
        />
      </body>
    </html>
  );
}