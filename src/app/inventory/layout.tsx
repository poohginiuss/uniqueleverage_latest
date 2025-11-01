"use client";

import { Suspense } from 'react';
import { ClientAuthGuard } from '@/components/auth/client-auth-guard';
import InventoryLayoutClient from './layout-client';

export default function InventoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
            <ClientAuthGuard>
                <InventoryLayoutClient>
                    {children}
                </InventoryLayoutClient>
            </ClientAuthGuard>
        </Suspense>
    );
}
