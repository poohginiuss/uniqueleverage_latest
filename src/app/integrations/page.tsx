"use client";

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
import { ULIntegrationsPage } from "@/components/landing/docs/integrations-content";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { Suspense, useState } from "react";

export default () => {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
    return (
        <div className="flex flex-col lg:flex-row">
            <SidebarNavigationSimple
                activeUrl="/integrations"
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
                        label: "Integrations",
                        href: "/projects",
                        items: [
                            { label: "Partners", href: "/docs/integrations" },
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
            <main className="min-w-0 flex-1 bg-secondary_subtle pb-12 shadow-none lg:bg-primary">
                <header className="max-lg:hidden sticky top-0 z-50 ">
                    <section
                        className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary md:h-15 border-b border-secondary"
                    >
                        <Breadcrumbs type="button">
                            <Breadcrumbs.Item href="#">Integrations</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="#">Inventory</Breadcrumbs.Item>
                        </Breadcrumbs>
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
                    </section>
                </header>
                <Suspense fallback={<div className="p-8">Loading...</div>}>
                    <ULIntegrationsPage />
                </Suspense>
            </main>
        </div>
    );
};