"use client";

import React, { useState } from "react";
import { SearchContext } from "@/contexts/search-context";

export default function MarketingLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [searchValue, setSearchValue] = useState("");
    
    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            <div className="flex-1 bg-secondary_subtle dark:bg-gray-950">
                {children}
            </div>
        </SearchContext.Provider>
    );
}
