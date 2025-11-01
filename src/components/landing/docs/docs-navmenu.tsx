import * as React from "react";
import { useState, useEffect, startTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { Key } from "react-aria-components";
import { Tabs } from "@/components/application/tabs/tabs";
import { NativeSelect } from "@/components/base/select/select-native";
const tabs = [
    { id: "docs", label: "Documentation" },
    { id: "inventory", label: "Inventory" },
    { id: "scheduling", label: "Messages" },
    { id: "marketing", label: "GPT" },
];

interface LineDemoProps { // Added interface
    onTabChange?: (tab: string) => void;
    docsLabel?: string; // Custom label for docs tab
    inventoryLabel?: string; // Custom label for inventory tab
    marketingLabel?: string; // Custom label for marketing tab
    schedulingLabel?: string; // Custom label for scheduling tab
    showOnlyDocs?: boolean; // Show only the docs tab (for admin dashboard)
}

export const LineDemo = ({ onTabChange, docsLabel = "Documentation", inventoryLabel = "Inventory", marketingLabel = "GPT", schedulingLabel = "Messages", showOnlyDocs = false }: LineDemoProps) => { // Accepted props
    const [selectedTab, setSelectedTab] = useState<string>("docs");
    const router = useRouter();
    const pathname = usePathname();

    // Set initial tab based on current URL - optimized to prevent unnecessary updates
    useEffect(() => {
        let newTab = "docs";
        if (pathname.includes("/inventory")) {
            newTab = "inventory";
        } else if (pathname.includes("/gpt")) {
            newTab = "marketing";
        } else if (pathname.includes("/scheduling")) {
            newTab = "scheduling";
        }
        
        // Only update if the tab actually changed
        setSelectedTab(newTab);
    }, [pathname]);

    const handleTabClick = (tabId: string, event: React.MouseEvent) => {
        event.preventDefault();
        
        // Update selected tab immediately for instant UI feedback
        setSelectedTab(tabId);
        
        // Use startTransition to make navigation smoother
        startTransition(() => {
            if (tabId === "inventory") {
                router.push("/inventory/all");
            } else if (tabId === "docs") {
                router.push("/docs/introduction");
            } else         if (tabId === "marketing") {
            router.push("/gpt/chat");
            } else if (tabId === "scheduling") {
                router.push("/scheduling");
            }
        });
    };


    return (
        <div className="flex flex-col gap-4 px-4 pt-6 lg:px-4 lg:pt-6">
            <div className="relative mb-2 flex">
                {/* Gray background line */}
                <div className="w-0.5 bg-border-secondary"></div>

                {/* Active highlight bar (move & resize with JS/React state) */}
                <div
                    className="absolute left-0 w-0.5 bg-fg-brand-primary_alt transition-all duration-150 ease-linear"
                    style={{ 
                        top: selectedTab === "docs" ? "0px" : 
                             selectedTab === "inventory" ? "24px" : 
                             selectedTab === "scheduling" ? "48px" : 
                             selectedTab === "marketing" ? "72px" : "0px", 
                        height: "20px" 
                    }}
                ></div>

                {/* Menu items */}
                <ul className="relative flex h-full w-full flex-col gap-1.5 pl-3 md:gap-1.5">
                    <li className="flex w-full">
                    <button
                        onClick={(e) => handleTabClick("docs", e)}
                        className={`w-full rounded-xs py-0 text-sm font-semibold outline-focus-ring 
                                focus-visible:outline-2 focus-visible:outline-offset-2 md:py-0 md:text-sm 
                                text-left m-0 p-0 border-0 bg-transparent
                                ${selectedTab === "docs" ? "text-brand-secondary" : "text-quaternary"}`}
                    >
                        {docsLabel}
                    </button>
                    </li>
                    {!showOnlyDocs && (
                        <>
                            <li className="flex w-full">
                            <button
                                onClick={(e) => handleTabClick("inventory", e)}
                                className={`w-full rounded-xs py-0 text-sm font-semibold outline-focus-ring 
                                        focus-visible:outline-2 focus-visible:outline-offset-2 md:py-0 md:text-sm 
                                        text-left m-0 p-0 border-0 bg-transparent
                                        ${selectedTab === "inventory" ? "text-brand-secondary" : "text-quaternary"}`}
                            >
                                {inventoryLabel}
                            </button>
                            </li>
                            <li className="flex w-full">
                            <button
                                onClick={(e) => handleTabClick("scheduling", e)}
                                className={`w-full rounded-xs py-0 text-sm font-semibold outline-focus-ring 
                                        focus-visible:outline-2 focus-visible:outline-offset-2 md:py-0 md:text-sm 
                                        text-left m-0 p-0 border-0 bg-transparent
                                        ${selectedTab === "scheduling" ? "text-brand-secondary" : "text-quaternary"}`}
                            >
                                {schedulingLabel}
                            </button>
                            </li>
                            <li className="flex w-full">
                            <button
                                onClick={(e) => handleTabClick("marketing", e)}
                                className={`w-full rounded-xs py-0 text-sm font-semibold outline-focus-ring 
                                        focus-visible:outline-2 focus-visible:outline-offset-2 md:py-0 md:text-sm 
                                        text-left m-0 p-0 border-0 bg-transparent
                                        ${selectedTab === "marketing" ? "text-brand-secondary" : "text-quaternary"}`}
                            >
                                {marketingLabel}
                            </button>
                            </li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
};