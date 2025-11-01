"use client";

import { useSessionValidation } from '@/hooks/use-session-validation';

export function SessionValidator() {
  useSessionValidation();
  return null; // This component doesn't render anything
}
