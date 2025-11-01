"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { Star06, Flag05, Settings01, MessageChatCircle, LayoutAlt01 } from "@untitledui/icons";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { FeaturedCardReferralLink } from "@/components/application/app-navigation/base-components/featured-cards.demo";
import { SearchContext } from "@/contexts/search-context";

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    
    // Check if current route should show sidebar
    const showSidebar = pathname.startsWith('/docs') || 
                       pathname.startsWith('/inventory') || 
                       pathname.startsWith('/gpt') ||
                       pathname.startsWith('/scheduling') ||
                       pathname.startsWith('/admin');
    
    // Don't show sidebar on login, signup, or other public pages
    if (!showSidebar) {
        return <>{children}</>;
    }

    // Check page-specific display options
    const isVehicleDetailPage = pathname.includes('/stock/');
    const isInventoryAllPage = pathname === '/inventory/all';
    const hideLogoOnMobile = isVehicleDetailPage || isInventoryAllPage;
    const showSearchOnMobile = isInventoryAllPage;
    const isMarketingPage = pathname.startsWith('/gpt');

    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <div className={`flex flex-col lg:flex-row min-h-screen ${isMarketingPage ? 'bg-secondary_subtle dark:bg-gray-950' : ''}`}>
                <SidebarNavigationSimple
                    activeUrl={pathname}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    hideLogoOnMobile={hideLogoOnMobile}
                    showSearchOnMobile={showSearchOnMobile}
                    showBackButton={isVehicleDetailPage}
                    onBack={() => {
                        router.push('/inventory/all');
                    }}
                    items={[
                        {
                            label: "Getting started",
                            href: "/",
                            items: [
                                { label: "Introduction", href: "/docs/introduction", icon: Star06 },
                                { label: "Request Feed", href: "/docs/request-feeds", icon: Flag05 },
                            ],
                        },
                        {
                            label: "Partners",
                            href: "/projects",
                            items: [
                                { label: "Integrations", href: "/docs/integrations" },
                            ],
                        },
                    ]}
                    footerItems={[
                        {
                            label: "Settings",
                            href: "/settings",
                            icon: Settings01,
                        },
                        {
                            label: "Support",
                            href: "/support",
                            icon: MessageChatCircle,
                            badge: (
                                <BadgeWithDot color="success" type="modern" size="sm">
                                    Online
                                </BadgeWithDot>
                            ),
                        },
                        {
                            label: "Open in browser",
                            href: "https://www.untitledui.com/",
                            icon: LayoutAlt01,
                        },
                    ]}
                    featureCard={
                        <FeaturedCardReferralLink
                            title="Refer a friend"
                            description="Earn 50% back for 12 months when someone uses your link."
                            onDismiss={() => {}}
                        />
                    }
                />
                <div className="flex-1 min-w-0">
                    {children}
                </div>
            </div>
        </SearchContext.Provider>
    );
}

