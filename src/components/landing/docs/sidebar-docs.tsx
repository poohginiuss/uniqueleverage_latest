
"use client";

import type { ReactNode } from "react";
import { useState, useEffect } from "react";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { useRouter, usePathname } from "next/navigation";
import { SearchLg } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo-2nd";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "../../application/app-navigation/base-components/mobile-header-2nd";
import { NavList } from "../../application/app-navigation/base-components/docs-nav-list";
import { LineDemo } from "@/components/landing/docs/docs-navmenu";
import { NavAccountMenu } from "../../application/app-navigation/base-components/nav-account-card";
import type { NavItemType } from "../../application/app-navigation/config";

interface SidebarNavigationProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: NavItemType[];
    /** List of footer items to display. */
    footerItems?: NavItemType[];
    /** Feature card to display. */
    featureCard?: ReactNode;
    /** Whether to show the account card. */
    showAccountCard?: boolean;
    /** Whether to hide the right side border. */
    hideBorder?: boolean;
    /** Additional CSS classes to apply to the sidebar. */
    className?: string;
    /** Currently selected tab from LineDemo */
    selectedTab?: string; // Added prop
    /** Search functionality */
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    /** Whether to hide logo on mobile (for VSP pages) */
    hideLogoOnMobile?: boolean;
    /** Whether to show search bar on mobile (only for inventory/all page) */
    showSearchOnMobile?: boolean;
    /** Whether to show back button on mobile */
    showBackButton?: boolean;
    /** Back button click handler */
    onBack?: () => void;
    /** Custom label for docs tab */
    docsLabel?: string;
    /** Custom label for inventory tab */
    inventoryLabel?: string;
    /** Custom label for marketing tab */
    marketingLabel?: string;
    /** Custom label for scheduling tab */
    schedulingLabel?: string;
    /** Show only the docs tab (for admin dashboard) */
    showOnlyDocs?: boolean;
}

export const SidebarNavigationSimple = ({
    activeUrl,
    items,
    footerItems = [],
    featureCard,
    showAccountCard = true,
    hideBorder = false,
    className,
    selectedTab, // Destructured prop
    searchValue = "",
    onSearchChange,
    hideLogoOnMobile = false,
    showSearchOnMobile = false,
    showBackButton = false,
    onBack,
    docsLabel,
    inventoryLabel,
    marketingLabel,
    schedulingLabel,
    showOnlyDocs,
}: SidebarNavigationProps) => {
    const MAIN_SIDEBAR_WIDTH = 249;
    const [currentTab, setCurrentTab] = useState<string>("docs");
    const [userData, setUserData] = useState<{firstName: string; lastName: string; email: string} | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Fetch user data from database
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Get user email from localStorage
                const userEmail = localStorage.getItem('userEmail');
                if (!userEmail) {
                    return;
                }

                const response = await fetch('/api/current-user', {
                    headers: {
                        'x-user-email': userEmail,
                    },
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setUserData({
                            firstName: result.user.firstName || '',
                            lastName: result.user.lastName || '',
                            email: result.user.email || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };

        fetchUserData();
    }, []);

    // Set initial tab based on current URL - optimized to prevent unnecessary updates
    useEffect(() => {
        let newTab = "docs";
        if (pathname.includes("/inventory")) {
            newTab = "inventory";
        } else if (pathname.includes("/marketing")) {
            newTab = "marketing";
        } else if (pathname.includes("/scheduling")) {
            newTab = "scheduling";
        }
        
        // Only update if the tab actually changed
        if (currentTab !== newTab) {
            setCurrentTab(newTab);
        }
    }, [pathname, currentTab]);

    const handleTabChange = (tab: string) => { // Added handler
        setCurrentTab(tab);
    };

    const handleInventoryClick = () => {
        setCurrentTab("inventory");
        router.push("/inventory/all");
    };

    const content = (
        <aside
            style={
                {
                    "--width": `${MAIN_SIDEBAR_WIDTH}px`,
                } as React.CSSProperties
            }
            className={cx(
                "flex h-full w-full max-w-full flex-col justify-between overflow-auto bg-primary pt-5 lg:w-(--width) page-transition",
                !hideBorder && "border-secondary md:border-r",
                className,
            )}
        >
            <div className="flex flex-col gap-5 px-5">
                <div className="flex justify-between">
                    <UntitledLogo className="h-6" />
                    {/* Dark Mode Toggle - Mobile Only */}
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
                        className="lg:hidden inline-flex items-center justify-center w-6 h-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all rounded-lg"
                        title="Toggle dark mode"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </button>
                </div>
                <Input 
                    aria-label="Search" 
                    placeholder={pathname.includes('/admin') ? "Search customers..." : "Search vehicles..."} 
                    icon={SearchLg}
                    value={searchValue}
                    onChange={(value) => onSearchChange?.(value)}
                />
            </div>
            <LineDemo 
                onTabChange={handleTabChange} 
                docsLabel={docsLabel}
                inventoryLabel={inventoryLabel}
                marketingLabel={marketingLabel}
                schedulingLabel={schedulingLabel}
                showOnlyDocs={showOnlyDocs}
            />
            {/* <hr className="border-t-1 border-border-secondary mt-2 mx-4"></hr> */}
            <div className="flex-1 px-2">
                {currentTab === "docs" && <NavList activeUrl={activeUrl} items={items} />}
                {currentTab === "inventory" && (
                    <NavList 
                        activeUrl={pathname} 
                        items={[
                            {
                                label: "Catalog",
                                href: "/inventory",
                                items: [
                                    { label: "All Inventory", href: "/inventory/all" },
                                ],
                            },
                        ]} 
                    />
                )}
                {currentTab === "marketing" && (
                    <NavList 
                        activeUrl={pathname}
                        items={[
                            {
                                label: "Marketing",
                                href: "/gpt",
                                items: [
                                    { label: "Chat", href: "/gpt/chat" },
                                    { label: "Campaigns", href: "/gpt/campaigns" },
                                    { label: "Ad-Wizard", href: "/gpt/wizard" },
                                    { label: "Contacts", href: "/gpt/contacts" },
                                    { label: "Automations", href: "/gpt/automations" },
                                ],
                            },
                        ]} 
                    />
                )}
                {currentTab === "scheduling" && (
                    <NavList 
                        activeUrl={pathname}
                        items={[
                            {
                                label: "Inbox",
                                href: "/scheduling",
                                items: [
                                    { label: "Facebook", href: "/scheduling" },
                                ],
                            },
                        ]} 
                    />
                )}
            </div>

            <div className="mt-auto flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6">
                {/* Mobile Account Section - Only visible on mobile */}
                <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-semibold">
                                    {userData?.firstName?.charAt(0) || 'U'}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {userData ? 
                                        `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'User' 
                                        : 'User'
                                    }
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {userData?.email || 'user@example.com'}
                                </p>
                            </div>
                        </div>
                        <DialogTrigger>
                            <AriaButton className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </AriaButton>
                            <Popover
                                className={({ isEntering, isExiting }) =>
                                    `w-64 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 ${
                                        isEntering
                                            ? "duration-150 ease-in animate-in fade-in-0 zoom-in-95"
                                            : "duration-100 ease-out animate-out fade-out-0 zoom-out-95"
                                    }`
                                }
                                placement="top"
                            >
                                <NavAccountMenu />
                            </Popover>
                        </DialogTrigger>
                    </div>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile header navigation */}
            <MobileNavigationHeader 
                hideLogo={hideLogoOnMobile} 
                showSearchOnMobile={showSearchOnMobile}
                showBackButton={showBackButton} 
                onBack={onBack}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
            >
                {content}
            </MobileNavigationHeader>

            {/* Desktop sidebar navigation */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex">{content}</div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{
                    paddingLeft: MAIN_SIDEBAR_WIDTH,
                }}
                className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />
        </>
    );
};
