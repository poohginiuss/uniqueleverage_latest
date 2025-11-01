"use client";

import { ThemeProvider } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function Theme({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Pages that should always be in light mode
    const lightModePages = [
        '/',
        '/login',
        '/signup',
        '/verify-email',
        '/schedule-demo',
        '/pricing',
        '/request-feeds'
    ];
    
    const shouldForceLightMode = lightModePages.includes(pathname);
    
    useEffect(() => {
        if (shouldForceLightMode) {
            // Force light mode for public pages
            document.documentElement.classList.remove('dark-mode');
        }
    }, [shouldForceLightMode]);
    
    return (
        <ThemeProvider 
            attribute="class" 
            value={{ dark: "dark-mode" }} 
            enableSystem={false}
            disableTransitionOnChange
            forcedTheme={shouldForceLightMode ? "light" : undefined}
        >
            {children}
        </ThemeProvider>
    );
}
