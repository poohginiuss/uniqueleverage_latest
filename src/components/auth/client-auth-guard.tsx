"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for auth parameters from direct login
    const auth = searchParams.get('auth');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    
    if (auth === 'success' && email && role) {
      // We have auth parameters, allow access (AuthHandler will set localStorage)
      setIsAuthenticated(true);
    } else {
      // Fast client-side check
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (isLoggedIn) {
        // Client-side check passed, allow access
        setIsAuthenticated(true);
      } else {
        // No client-side session, redirect to login
        router.push('/login');
      }
    }
  }, [router, searchParams]);

  // Show nothing while checking (prevents flash)
  if (isAuthenticated === null) {
    return null;
  }

  // Only render children if authenticated
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // This shouldn't render since we redirect above, but just in case
  return null;
}
