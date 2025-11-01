'use client';

import React from 'react';
import { UntitledLogo } from '@/components/foundations/logo/untitledui-logo-2nd';

export default function ScheduleDemoPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-center">
                        <a href="/">
                            <UntitledLogo className="h-8" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Choose a time for your demo
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Schedule a time with your dedicated automotive marketing expert so we can learn more about your dealership and get you seamlessly setup with Unique Leverage.
                    </p>
                </div>

                {/* Calendly Embed */}
                <div 
                    className="calendly-inline-widget" 
                    data-url="https://uniqueleverage.com/scheduler"
                    style={{ minWidth: '320px', height: '100vh' }}
                ></div>
            </div>
        </div>
    );
}
