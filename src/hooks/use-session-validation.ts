"use client";

import { useEffect } from 'react';

export function useSessionValidation() {
  useEffect(() => {
    // Disabled background validation for now to prevent redirect loops
    // Client-side localStorage check is sufficient for navigation speed
    // Server-side validation only happens during login/logout
    console.log('Session validation disabled for performance');
  }, []);
}
