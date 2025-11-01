"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const useSmoothNavigation = () => {
  const router = useRouter();

  const navigate = useCallback((path: string) => {
    // Use push for consistent navigation behavior like sidebar links
    router.push(path);
  }, [router]);

  return { navigate };
};
