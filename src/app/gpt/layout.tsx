"use client";

import { Suspense } from 'react';
import { ClientAuthGuard } from '@/components/auth/client-auth-guard';
import MarketingLayoutClient from './layout-client';

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
            <ClientAuthGuard>
                <MarketingLayoutClient>
                    {children}
                </MarketingLayoutClient>
            </ClientAuthGuard>
        </Suspense>
    );
}
