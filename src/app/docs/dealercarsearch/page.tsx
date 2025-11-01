"use client";

import { useTheme } from "next-themes";

import {
    Colors,
    Cube01,
    Figma,
    File04,
    Flag05,
    Globe01,
    LayoutAlt01,
    MessageChatCircle,
    Settings01,
    Star06,
} from "@untitledui/icons";
import { FeaturedCardReferralLink } from "@/components/application/app-navigation/base-components/featured-cards.demo";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { DealerCarSearchPage } from "@/components/landing/docs/dealer-car-search-content";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { useState } from "react";

export default () => {
    const { theme, setTheme } = useTheme();
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
    return (
        <div className="flex flex-col lg:flex-row">
            <SidebarNavigationSimple
                activeUrl="/docs/dealercarsearch"
                items={[
                    {
                        label: "Getting started",
                        href: "/docs/introduction",
                        items: [
                            { label: "Introduction", href: "/docs/introduction", icon: Star06 },
                            { label: "Request Feed", href: "/docs/request-feeds", icon: Flag05 },
                        ],
                    },
                    {
                        label: "Partners",
                        href: "/docs/integrations",
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
            <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-12 shadow-none lg:bg-primary dark:lg:bg-gray-950 page-transition content-area">
                <header className="max-lg:hidden sticky top-0 z-50 ">
                    <section
                        className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700"
                    >
                        <Breadcrumbs type="button">
                            <Breadcrumbs.Item href="#">Docs</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="/docs/introduction">Getting started</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="#">DealerCarSearch</Breadcrumbs.Item>
                        </Breadcrumbs>
                        <div className="flex items-center gap-3">
                            {/* Dark Mode Toggle - Desktop Only */}
                            <button
                                onClick={() => {
                                    setTheme(theme === 'dark' ? 'light' : 'dark');
                                }}
                                className="hidden lg:flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Toggle dark mode"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            </button>
                            <DialogTrigger isOpen={isAccountMenuOpen} onOpenChange={setIsAccountMenuOpen}>
                                <AriaButton className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none">
                                    <span>Account</span>
                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                </AriaButton>
                                <Popover
                                    placement="bottom right"
                                    offset={8}
                                    className={({ isEntering, isExiting }) =>
                                        `will-change-transform ${
                                            isEntering
                                                ? "duration-300 ease-out animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                                                : isExiting
                                                ? "duration-150 ease-in animate-out fade-out-0 zoom-out-95 data-[side=bottom]:slide-out-to-top-2"
                                                : ""
                                        } rounded-lg p-1 text-gray-900 shadow-lg dark:text-gray-100`
                                    }
                                >
                                    <NavAccountMenu onClose={() => setIsAccountMenuOpen(false)} />
                                </Popover>
                            </DialogTrigger>
                        </div>
                    </section>
                </header>
                <DealerCarSearchPage />
            </main>
        </div>
    );
};
