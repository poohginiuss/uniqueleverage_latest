"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have auth parameters from direct login
    const auth = searchParams.get('auth');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const firstName = searchParams.get('firstName');

    if (auth === 'success' && email && role) {
      // Set localStorage for client-side authentication
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', role);
      if (firstName) {
        localStorage.setItem('userFirstName', firstName);
      }

      // Clean up URL by removing auth parameters
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('auth');
      currentUrl.searchParams.delete('email');
      currentUrl.searchParams.delete('role');
      currentUrl.searchParams.delete('firstName');
      
      // Replace URL without auth parameters
      window.history.replaceState({}, '', currentUrl.toString());
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
