"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

export function SystemTheme({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Ensure system pages can use dark mode
        const html = document.documentElement;
        html.classList.add('system-pages');
        
        return () => {
            // Cleanup when component unmounts
            html.classList.remove('system-pages');
        };
    }, []);

    return (
        <ThemeProvider 
            attribute="class" 
            value={{ dark: "dark-mode" }} 
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
