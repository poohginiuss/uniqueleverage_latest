"use client";

import React, { useEffect } from "react";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ChevronDown } from "@untitledui/icons";
import { ULIntroPage } from "@/components/landing/docs/intro-content";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { useState } from "react";

export default function MarketingPage() {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
    // Theme is now handled by the global ThemeProvider

    return (
        <>
            <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary md:h-15 border-b border-secondary">
                <Breadcrumbs type="button">
                    <Breadcrumbs.Item href="#">Marketing</Breadcrumbs.Item>
                    <Breadcrumbs.Item href="#">Ad Wizard</Breadcrumbs.Item>
                </Breadcrumbs>
                <div className="flex items-center gap-3">
                    {/* Playground Link */}
                    <a 
                        href="/gpt/chat" 
                        className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        Playground
                    </a>
                    {/* Account Button */}
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
                    
                    {/* Dark Mode Toggle - Desktop Only */}
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
                        className="hidden lg:flex items-center justify-center w-9 h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Toggle dark mode"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    </button>
                </div>
            </section>
            <ULIntroPage />
        </>
    );
}
