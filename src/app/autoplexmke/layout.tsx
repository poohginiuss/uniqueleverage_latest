"use client";

import { Suspense } from 'react';
import InventoryLayoutClient from './layout-client';

export default function GulfSeaAutoLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
            <InventoryLayoutClient>
                {children}
            </InventoryLayoutClient>
        </Suspense>
    );
}
