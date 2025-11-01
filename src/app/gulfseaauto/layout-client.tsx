"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { SearchContext } from "@/contexts/search-context";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo-2nd";
import { Phone01, MarkerPin06, ArrowRight, ArrowLeft, Moon01 } from "@untitledui/icons";

export default function GulfSeaAutoLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    const [userLogo, setUserLogo] = useState<string | null>(null);
    const [dealershipName, setDealershipName] = useState<string>("Autoplex MKE");
    const [showContactModal, setShowContactModal] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    
    // Gulf Sea Auto specific settings
    const isVehicleDetailPage = pathname.includes('/stock/');
    const isGulfSeaAutoPage = pathname === '/autoplexmke';
    const hideLogoOnMobile = isVehicleDetailPage || isGulfSeaAutoPage;
    const showSearchOnMobile = isGulfSeaAutoPage;
    
    // Scroll detection for mobile logo hiding
    useEffect(() => {
        const handleScroll = () => {
            // Only apply scroll effects on mobile (below md breakpoint)
            const isMobile = window.innerWidth < 768; // md breakpoint is 768px
            if (isMobile) {
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                setIsScrolled(scrollTop > 50); // Hide logo after 50px scroll
            } else {
                setIsScrolled(false); // Always show logo on desktop/tablet
            }
        };

        // Set initial state
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll); // Handle window resize
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    // Fetch user logo from account settings with optimized caching
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userEmail = localStorage.getItem('userEmail');
                if (userEmail) {
                    // Check if we have cached data first with timestamp
                    const cachedData = localStorage.getItem('autoplexmke-user-data');
                    const cacheTimestamp = localStorage.getItem('autoplexmke-cache-timestamp');
                    const now = Date.now();
                    const cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
                    
                    if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < cacheExpiry) {
                        const parsed = JSON.parse(cachedData);
                        setUserLogo(parsed.avatarUrl);
                        if (parsed.dealershipName) {
                            setDealershipName(parsed.dealershipName);
                        }
                        return; // Skip API call if we have fresh cached data
                    }
                    
                    // Only fetch if no cache or cache expired
                    const response = await fetch(`/api/account?email=${encodeURIComponent(userEmail)}`, {
                        headers: {
                            'x-user-email': userEmail,
                            'Cache-Control': 'no-cache', // Ensure fresh data
                        },
                        // Add timeout to prevent hanging
                        signal: AbortSignal.timeout(5000), // 5 second timeout
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.data) {
                            setUserLogo(data.data.avatarUrl);
                            if (data.data.dealershipName) {
                                setDealershipName(data.data.dealershipName);
                            }
                            // Cache the data with timestamp
                            localStorage.setItem('autoplexmke-user-data', JSON.stringify({
                                avatarUrl: data.data.avatarUrl,
                                dealershipName: data.data.dealershipName
                            }));
                            localStorage.setItem('autoplexmke-cache-timestamp', now.toString());
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                // If API fails, try to use cached data even if expired
                const cachedData = localStorage.getItem('autoplexmke-user-data');
                if (cachedData) {
                    const parsed = JSON.parse(cachedData);
                    setUserLogo(parsed.avatarUrl);
                    if (parsed.dealershipName) {
                        setDealershipName(parsed.dealershipName);
                    }
                }
            }
        };
        
        fetchUserData();
    }, []);
    
    // Debug log
    console.log('Current pathname:', pathname, 'isVehicleDetailPage:', isVehicleDetailPage);

    // Ensure body styles don't interfere
    useEffect(() => {
        // Remove any conflicting styles
        document.body.style.position = 'static';
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.position = 'static';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';
        
        // Remove transitions that might interfere
        const style = document.createElement('style');
        style.textContent = `
            .autoplexmke-page * {
                transition: none !important;
                transform: none !important;
            }
            .autoplexmke-page header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                z-index: 99999 !important;
                width: 100% !important;
                transform: none !important;
            }
        `;
        document.head.appendChild(style);
        
        // Force the header to stay on top
        const header = document.querySelector('header');
        if (header) {
            header.style.position = 'fixed';
            header.style.top = '0';
            header.style.left = '0';
            header.style.right = '0';
            header.style.zIndex = '99999';
            header.style.width = '100%';
            header.style.transform = 'none';
        }
        
        // Force the page container to be full width
        const pageContainer = document.querySelector('.autoplexmke-page') as HTMLElement;
        if (pageContainer) {
            pageContainer.style.width = '100vw';
            pageContainer.style.marginLeft = 'calc(-50vw + 50%)';
            pageContainer.style.marginRight = 'calc(-50vw + 50%)';
        }
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Effect to handle dark mode body background
    useEffect(() => {
        const handleThemeChange = () => {
            if (document.documentElement.classList.contains('dark-mode')) {
                document.body.style.backgroundColor = '#090717';
                document.documentElement.style.backgroundColor = '#090717';
                // Also force any parent containers to be dark
                const parentContainers = document.querySelectorAll('main, div[class*="layout"], body > div');
                parentContainers.forEach(container => {
                    if (container instanceof HTMLElement) {
                        container.style.backgroundColor = '#090717';
                    }
                });
            } else {
                document.body.style.backgroundColor = '';
                document.documentElement.style.backgroundColor = '';
                // Reset parent containers
                const parentContainers = document.querySelectorAll('main, div[class*="layout"], body > div');
                parentContainers.forEach(container => {
                    if (container instanceof HTMLElement) {
                        container.style.backgroundColor = '';
                    }
                });
            }
        };

        // Set initial state
        handleThemeChange();

        // Listen for theme changes
        const observer = new MutationObserver(handleThemeChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
            document.body.style.backgroundColor = '';
            document.documentElement.style.backgroundColor = '';
        };
    }, []);

    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <div className="autoplexmke-page bg-white dark:bg-gray-950 min-h-screen w-full">
                {/* Fixed header outside of main container */}
                <header 
                    className="bg-white/95 dark:bg-[#090717]/95 backdrop-blur-md border-b border-gray-50 dark:border-gray-800/50 shadow-lg"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        zIndex: 99999,
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform'
                    } as React.CSSProperties}
                >
                    <div className={`w-full bg-transparent flex items-center transition-all duration-300 ease-in-out ${isVehicleDetailPage ? 'h-20' : (isScrolled ? 'h-16 md:h-20 lg:h-20' : 'h-32 md:h-20 lg:h-20')}`}>
                        {/* Desktop: Main Page Layout - Logo, Search, Action Buttons */}
                        {!isVehicleDetailPage && (
                            <div className="hidden lg:flex items-center max-w-7xl mx-auto px-8 w-full">
                                {/* Logo - Aligned with first carousel card */}
                                <div className="flex-shrink-0">
                                    <button 
                                        onClick={() => router.push('/autoplexmke')}
                                        className="hover:opacity-80 transition-opacity duration-200"
                                    >
                                        {userLogo ? (
                                            <img 
                                                src={userLogo} 
                                                alt={dealershipName}
                                                className="h-12 w-auto max-w-[160px] object-contain"
                                            />
                                        ) : (
                                            <div>
                                                <h1 className="text-lg font-bold text-gray-900">{dealershipName}</h1>
                                            </div>
                                        )}
                                    </button>
                                </div>
                                
                                {/* Search bar - Fits nicely in the middle */}
                                <div className="flex-1 flex justify-center">
                                    <div className="relative group w-full max-w-lg">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                            placeholder="What are you looking for?"
                                            className="block w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md"
                                        />
                                        {searchValue && (
                                            <button
                                                onClick={() => setSearchValue('')}
                                                className="absolute inset-y-0 right-0 pr-4 flex items-center group/clear"
                                            >
                                                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 group-hover/clear:scale-110 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Action Buttons - Aligned with last carousel card */}
                                <div className="flex-shrink-0">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => {
                                                const html = document.documentElement;
                                                const isDark = html.classList.contains('dark-mode');
                                                if (isDark) {
                                                    html.classList.remove('dark-mode');
                                                    localStorage.setItem('theme', 'light');
                                                } else {
                                                    html.classList.add('dark-mode');
                                                    localStorage.setItem('theme', 'dark');
                                                }
                                            }}
                                            className="px-3 py-2 bg-transparent border-transparent text-gray-700 dark:text-gray-300 text-sm rounded-full hover:bg-transparent transition-all duration-200 font-medium whitespace-nowrap shadow-none focus:outline-none focus:ring-0 flex items-center gap-1.5"
                                        >
                                            <Moon01 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Open application form or redirect to application page
                                                window.open('https://calendly.com/uniqueleverage/scheduler', '_blank');
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-full transition-all duration-200 font-medium whitespace-nowrap shadow-sm focus:outline-none focus:ring-0 flex items-center gap-1.5"
                                        >
                                            Apply Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Desktop: Vehicle Detail Page Layout - Back arrow, Logo, Moon icon */}
                        {isVehicleDetailPage && (
                            <div className="w-full max-w-4xl mx-auto px-6 bg-transparent">
                                <div className="flex items-center justify-between">
                                    {/* Back Arrow */}
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => router.back()}
                                            className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent hover:bg-transparent transition-colors duration-200"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                        </button>
                                    </div>
                                    
                                    {/* Logo - Centered */}
                                    <div className="flex-1 flex justify-center">
                                        <button 
                                            onClick={() => router.push('/autoplexmke')}
                                            className="hover:opacity-80 transition-opacity duration-200"
                                        >
                                            {userLogo ? (
                                                <img 
                                                    src={userLogo} 
                                                    alt={dealershipName}
                                                    className="h-10 w-auto max-w-[160px] object-contain"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{dealershipName}</h1>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                    
                                    {/* Moon Icon */}
                                    <div className="flex-shrink-0">
                                        <button 
                                            onClick={() => {
                                                const html = document.documentElement;
                                                const isDark = html.classList.contains('dark-mode');
                                                if (isDark) {
                                                    html.classList.remove('dark-mode');
                                                    localStorage.setItem('theme', 'light');
                                                } else {
                                                    html.classList.add('dark-mode');
                                                    localStorage.setItem('theme', 'dark');
                                                }
                                            }}
                                            className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent hover:bg-transparent transition-colors duration-200"
                                        >
                                            <Moon01 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tablet: Compact Layout */}
                        {!isVehicleDetailPage && (
                            <div className="hidden md:flex lg:hidden items-center justify-between gap-3 max-w-7xl mx-auto px-8 w-full">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <button 
                                    onClick={() => router.push('/gulfseaauto')}
                                    className="hover:opacity-80 transition-opacity duration-200"
                                >
                                    {userLogo ? (
                                        <img 
                                            src={userLogo} 
                                            alt={dealershipName}
                                            className="h-10 w-auto max-w-[140px] object-contain"
                                        />
                                    ) : (
                                        <div>
                                            <h1 className="text-base font-bold text-gray-900">{dealershipName}</h1>
                                            <p className="text-xs text-gray-600">Quality Pre-Owned Vehicles</p>
                                        </div>
                                    )}
                                </button>
                            </div>
                            
                            {/* Search bar */}
                            <div className="relative group flex-1 max-w-xs">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-500 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    placeholder="What are you looking for?"
                                    className="block w-full pl-9 pr-9 py-2 border-0 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:shadow-none transition-all duration-200 text-sm text-gray-900 dark:text-gray-100"
                                />
                                {searchValue && (
                                    <button
                                        onClick={() => setSearchValue('')}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center group/clear"
                                    >
                                        <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 group-hover/clear:scale-110 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        const html = document.documentElement;
                                        const isDark = html.classList.contains('dark-mode');
                                        if (isDark) {
                                            html.classList.remove('dark-mode');
                                            localStorage.setItem('theme', 'light');
                                        } else {
                                            html.classList.add('dark-mode');
                                            localStorage.setItem('theme', 'dark');
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-transparent border-transparent text-gray-700 dark:text-gray-300 text-xs rounded-full hover:bg-transparent transition-all duration-200 font-medium whitespace-nowrap shadow-none flex items-center gap-1.5"
                                >
                                    <Moon01 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => {
                                        // Open application form or redirect to application page
                                        window.open('https://calendly.com/uniqueleverage/scheduler', '_blank');
                                    }}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-all duration-200 font-medium whitespace-nowrap shadow-sm flex items-center gap-1.5"
                                >
                                    Apply Now
                                </button>
                            </div>
                        </div>
                        )}

                        {/* Mobile Layout - Logo, Search, and Moon Button (Logo hides on scroll) */}
                        {!isVehicleDetailPage && (
                            <div className="md:hidden relative w-full px-4 pt-8 pb-4">
                                {/* Moon Button - Top Right */}
                                <button 
                                    onClick={() => {
                                        const html = document.documentElement;
                                        const isDark = html.classList.contains('dark-mode');
                                        if (isDark) {
                                            html.classList.remove('dark-mode');
                                            localStorage.setItem('theme', 'light');
                                        } else {
                                            html.classList.add('dark-mode');
                                            localStorage.setItem('theme', 'dark');
                                        }
                                    }}
                                    className="absolute top-6 right-6 flex items-center justify-center w-9 h-9 rounded-full bg-transparent hover:bg-transparent transition-colors duration-200 z-10"
                                >
                                    <Moon01 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                </button>
                                
                                {/* Logo - Hidden when scrolled */}
                                {!isScrolled && (
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={() => router.push('/autoplexmke')}
                                            className="mb-3 hover:opacity-80 transition-opacity duration-200"
                                        >
                                            {userLogo ? (
                                                <img 
                                                    src={userLogo} 
                                                    alt={dealershipName}
                                                    className="h-9 w-auto object-contain"
                                                />
                                            ) : (
                                                <div>
                                                    <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{dealershipName}</h1>
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                )}
                                
                                {/* Search Bar - Centered */}
                                <div className="flex justify-center">
                                    <div className="w-full max-w-xs">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                value={searchValue}
                                                onChange={(e) => setSearchValue(e.target.value)}
                                                placeholder="What are you looking for?"
                                                className="block w-full pl-10 pr-10 py-3 border-0 rounded-lg leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-200 text-sm text-gray-900 dark:text-gray-100"
                                            />
                                            {searchValue && (
                                                <button
                                                    onClick={() => setSearchValue('')}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center group/clear"
                                                >
                                                    <svg className="h-4 w-4 text-gray-400 hover:text-gray-600 group-hover/clear:scale-110 transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                    </div>
                </header>
            
                {/* Main content with padding to account for fixed header */}
                <div 
                    className={`min-h-screen bg-white dark:bg-gray-950 pb-16 md:pb-0 transition-all duration-300 ease-in-out ${isVehicleDetailPage ? 'pt-20' : (isScrolled ? 'pt-16 sm:pt-20' : 'pt-32 sm:pt-20')}`}
                    style={{
                        position: 'relative',
                        overflow: 'visible'
                    }}
                >
                    <main className="flex-1">
                    {children}
                    </main>
                </div>
                
                {/* Mobile Bottom Sticky Action Bar */}
                {!isVehicleDetailPage && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#090717] border-t border-gray-200 dark:border-gray-800 shadow-lg z-50 md:hidden">
                    <div className="flex items-center justify-center space-x-3 px-4 py-3">
                        <a
                            href="tel:+14145551234"
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors duration-200"
                        >
                            <Phone01 className="w-3.5 h-3.5" />
                            Call
                        </a>
                        <button
                            onClick={() => {
                                // Open application form or redirect to application page
                                window.open('https://calendly.com/uniqueleverage/scheduler', '_blank');
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium shadow-sm transition-colors duration-200"
                        >
                            Apply Now
                        </button>
                    </div>
                </div>
                )}
            </div>
        </SearchContext.Provider>
    );
}
