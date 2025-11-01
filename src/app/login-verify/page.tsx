"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal-2nd";

function LoginVerifyContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const verifyLogin = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/verify-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ token }),
        });

        const result = await response.json();

        if (response.ok) {
          // Store login success in localStorage for backward compatibility
          localStorage.setItem('userEmail', result.user.email);
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('userRole', result.user.role);
          
          // IMMEDIATE redirect - no delays, no messages
          if (result.user.role === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/docs/introduction');
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Login verification error:', error);
        router.push('/login');
      }
    };

    verifyLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Logo */}
        <div className="mb-8">
          <UntitledLogoMinimal className="h-12 w-12 mx-auto hover:opacity-80 transition-opacity" />
        </div>

        {/* Simple loading message */}
        <div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Signing you in...</h1>
          <p className="text-gray-600">Please wait a moment.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-8">
            <UntitledLogoMinimal className="h-12 w-12 mx-auto hover:opacity-80 transition-opacity" />
          </div>
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">Please wait a moment.</p>
          </div>
        </div>
      </div>
    }>
      <LoginVerifyContent />
    </Suspense>
  );
}
