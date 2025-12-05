"use client";

import React, { useState } from "react";
import { SearchContext } from "@/contexts/search-context";

export default function InventoryLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const [searchValue, setSearchValue] = useState("");

    return (
        <SearchContext.Provider value={{ searchValue, setSearchValue }}>
            {children}
        </SearchContext.Provider>
    );
}
