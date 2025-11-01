"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { SearchContext } from "@/contexts/search-context";

export default function MarketingLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [searchValue, setSearchValue] = useState("");
    
    // Check if we're on a marketing sub-page
    const isMarketingSubPage = pathname.includes('/gpt/');
    const hideLogoOnMobile = false;
    const showSearchOnMobile = false; // No search for marketing pages
    
    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <div className="flex flex-col lg:flex-row min-h-screen layout-container bg-secondary_subtle dark:bg-gray-950">
                <SidebarNavigationSimple
                    activeUrl={pathname}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    hideLogoOnMobile={hideLogoOnMobile}
                    showSearchOnMobile={showSearchOnMobile}
                    showBackButton={false}
                    onBack={() => {}}
                    items={[
                        {
                            label: "Marketing",
                            items: [
                                { label: "Chat", href: "/gpt/chat" },
                                { label: "Ad-Wizard", href: "/gpt/wizard" },
                            ],
                        },
                    ]}
                />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </SearchContext.Provider>
    );
}
