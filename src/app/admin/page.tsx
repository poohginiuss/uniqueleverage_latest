"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BarChartSquare02, CheckDone01, HomeLine, PieChart03, Rows01, SearchLg, Users01 } from "@untitledui/icons";
import type { Selection, SortDescriptor } from "react-aria-components";
import { Bar, CartesianGrid, ComposedChart, Line, Tooltip as RechartsTooltip, ResponsiveContainer, XAxis } from "recharts";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { ChevronDown } from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ChartTooltipContent, selectEvenlySpacedItems } from "@/components/application/charts/charts-base";
import { PaginationPageMinimalCenter } from "@/components/application/pagination/pagination";
import { Table } from "@/components/application/table/table";
import { TabList, Tabs } from "@/components/application/tabs/tabs";
import { Avatar } from "@/components/base/avatar/avatar";
import { BadgeWithDot } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Dropdown } from "@/components/base/dropdown/dropdown";
import { Edit01, Copy01, Trash01, PauseCircle, Play } from "@untitledui/icons";
import { MetricsChart01 } from "@/components/application/metrics/metrics";
import { MobileNavigationHeader } from "@/components/application/app-navigation/base-components/mobile-header-2nd";
import { ThemeProvider, useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";

// Helper functions for formatting
const formatDate = (timestamp: number): string =>
    new Date(timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const data = [
    { date: "2025-01-01", A: 633, B: 190 },
    { date: "2025-01-06", A: 443, B: 228 },
    { date: "2025-01-12", A: 506, B: 225 },
    { date: "2025-01-18", A: 316, B: 227 },
    { date: "2025-01-24", A: 760, B: 209 },
    { date: "2025-02-01", A: 950, B: 220 },
    { date: "2025-02-05", A: 760, B: 224 },
    { date: "2025-02-11", A: 633, B: 285 },
    { date: "2025-02-17", A: 570, B: 279 },
    { date: "2025-02-23", A: 253, B: 296 },
    { date: "2025-03-01", A: 380, B: 263 },
    { date: "2025-03-07", A: 443, B: 333 },
    { date: "2025-03-13", A: 506, B: 335 },
    { date: "2025-03-19", A: 443, B: 306 },
    { date: "2025-04-25", A: 316, B: 315 },
    { date: "2025-04-01", A: 190, B: 325 },
    { date: "2025-04-06", A: 316, B: 343 },
    { date: "2025-04-12", A: 380, B: 367 },
    { date: "2025-04-18", A: 506, B: 372 },
    { date: "2025-04-24", A: 443, B: 374 },
    { date: "2025-05-01", A: 696, B: 278 },
    { date: "2025-05-06", A: 950, B: 258 },
    { date: "2025-05-12", A: 823, B: 341 },
    { date: "2025-05-18", A: 633, B: 357 },
    { date: "2025-05-24", A: 570, B: 372 },
    { date: "2025-06-01", A: 253, B: 404 },
    { date: "2025-06-06", A: 316, B: 314 },
    { date: "2025-06-11", A: 443, B: 344 },
    { date: "2025-06-17", A: 380, B: 359 },
    { date: "2025-06-23", A: 253, B: 400 },
    { date: "2025-07-01", A: 190, B: 381 },
    { date: "2025-07-05", A: 316, B: 427 },
    { date: "2025-07-11", A: 506, B: 494 },
    { date: "2025-07-17", A: 633, B: 371 },
    { date: "2025-07-23", A: 570, B: 382 },
    { date: "2025-08-01", A: 760, B: 383 },
    { date: "2025-08-06", A: 950, B: 361 },
    { date: "2025-08-10", A: 823, B: 358 },
    { date: "2025-08-16", A: 696, B: 405 },
    { date: "2025-08-22", A: 570, B: 400 },
    { date: "2025-09-01", A: 443, B: 391 },
    { date: "2025-09-03", A: 316, B: 425 },
    { date: "2025-09-09", A: 253, B: 406 },
    { date: "2025-09-15", A: 380, B: 472 },
    { date: "2025-09-21", A: 506, B: 441 },
    { date: "2025-10-01", A: 633, B: 477 },
    { date: "2025-10-03", A: 570, B: 465 },
    { date: "2025-10-09", A: 443, B: 488 },
    { date: "2025-10-15", A: 380, B: 501 },
    { date: "2025-10-21", A: 316, B: 615 },
    { date: "2025-11-01", A: 570, B: 612 },
    { date: "2025-11-02", A: 506, B: 673 },
    { date: "2025-11-08", A: 443, B: 630 },
    { date: "2025-11-14", A: 506, B: 575 },
    { date: "2025-12-20", A: 760, B: 630 },
    { date: "2025-12-26", A: 443, B: 597 },
    { date: "2025-12-02", A: 696, B: 618 },
    { date: "2025-12-08", A: 506, B: 572 },
    { date: "2025-12-14", A: 316, B: 636 },
    { date: "2025-12-20", A: 633, B: 664 },
    { date: "2025-12-25", A: 380, B: 742 },
    { date: "2025-12-31", A: 633, B: 808 },
];


function AdminPage() {
    const router = useRouter();
    const { isAuthenticated, user } = useAuth();
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "subscriptionStatus",
        direction: "ascending",
    });
    const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const { theme, setTheme } = useTheme();

    // Debug tab changes
    console.log('Active tab:', activeTab);

    // Filter users based on search query and active tab
    const filteredUsers = useMemo(() => {
        let filtered = users;

        // Apply tab-based filtering first
        if (activeTab !== 'all') {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            filtered = users.filter(user => {
                switch (activeTab) {
                    case 'active':
                        return user.subscriptionStatus === 'active';
                    case 'new':
                        return new Date(user.dateAdded) > thirtyDaysAgo;
                    case 'support':
                        // For now, consider customers with past_due or unpaid as needing support
                        return user.subscriptionStatus === 'past_due' || user.subscriptionStatus === 'unpaid';
                    case 'canceled':
                        const isCanceled = user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'inactive';
                        if (activeTab === 'canceled') {
                            console.log(`User ${user.name}: status="${user.subscriptionStatus}", isCanceled=${isCanceled}`);
                        }
                        return isCanceled;
                    default:
                        return true;
                }
            });

            if (activeTab === 'canceled') {
                console.log(`Canceled filter: ${filtered.length} of ${users.length} users`);
                console.log('All statuses:', users.map(u => `${u.name}: ${u.subscriptionStatus}`));
            }


        }

        // Apply search filtering
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            
            filtered = filtered.filter(user => {
                // Search across all relevant fields
                const searchableFields = [
                    user.name || '',
                    user.email || '',
                    user.dealershipName || '',
                    user.phone || '',
                    user.businessAddress || '',
                    user.city || '',
                    user.state || '',
                    user.zip || '',
                    user.subscriptionStatus || '',
                    user.id || '',
                ];

                return searchableFields.some(field => 
                    String(field).toLowerCase().includes(query)
                );
            });
        }

        return filtered;
    }, [users, searchQuery, activeTab]);

    // Calculate derived metrics
    const monthlyRevenue = useMemo(() => {
        return users.reduce((total, user) => {
            if (user.subscriptionStatus === 'active' && user.subscriptionPrice) {
                return total + user.subscriptionPrice;
            }
            return total;
        }, 0);
    }, [users]);

    const activeCustomers = useMemo(() => {
        return users.filter(user => user.subscriptionStatus === 'active');
    }, [users]);

    const newCustomers = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return users.filter(user => new Date(user.dateAdded) > thirtyDaysAgo);
    }, [users]);

    const frozenCustomers = useMemo(() => {
        return users.filter(user => 
            user.subscriptionStatus === 'paused' || 
            user.subscriptionStatus === 'incomplete' ||
            user.subscriptionStatus === 'past_due'
        );
    }, [users]);

    const offlineCustomers = useMemo(() => {
        return users.filter(user => 
            user.subscriptionStatus === 'canceled' || 
            user.subscriptionStatus === 'inactive' ||
            user.subscriptionStatus === 'unpaid'
        );
    }, [users]);

    // Handle subscription management actions
    const handleSubscriptionAction = async (action: string, customerId: string, subscriptionId: string) => {
        setActionLoading(`${action}-${customerId}`);
        
        try {
            const response = await fetch('/api/admin/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    customerId,
                    subscriptionId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Refresh the user data from MySQL
                const usersResponse = await fetch('/api/auth');
                const usersResult = await usersResponse.json();
                
                if (usersResult.users && Array.isArray(usersResult.users)) {
                    const transformedUsers = usersResult.users.map((user: any) => {
                        try {
                            return {
                                id: user.id || user.email,
                                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
                                email: user.email || 'No email',
                                access: user.role === 'admin' ? ['Admin', 'Data export', 'Data import'] : 
                                        user.role === 'system_admin' ? ['System Admin', 'Full Access', 'User Management'] :
                                        user.username && user.username !== user.email ? ['Admin User', 'Data export', 'Data import'] :
                                        ['Data export'],
                                lastActive: new Date(user.last_login_at || user.created_at || new Date()).getTime(),
                                dateAdded: new Date(user.created_at || new Date()).getTime(),
                                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random&color=fff&size=40`,
                                dealershipName: user.dealership_name || 'Unknown Dealership',
                                subscriptionStatus: user.subscription_status || 'inactive',
                                subscriptionPrice: parseFloat(user.subscription_amount) || 0,
                                phone: user.phone || 'No phone',
                                businessAddress: user.business_address || 'No address',
                                city: user.city || 'No city',
                                state: user.state || 'No state',
                                zip: user.zip || 'No zip',
                                subscriptionId: user.subscription_id || 'No subscription',
                                customerId: user.customer_id || user.id
                            };
                        } catch (error) {
                            console.error('Error transforming user:', user, error);
                            return null;
                        }
                    }).filter(Boolean);
                    
                    setUsers(transformedUsers);
                }
            } else {
                console.error('Failed to manage subscription:', result.error);
                alert(`Failed to ${action} subscription: ${result.error}`);
            }
        } catch (error) {
            console.error('Error managing subscription:', error);
            alert(`Failed to ${action} subscription`);
        } finally {
            setActionLoading(null);
        }
    };


    // Fetch real customer data from MySQL database
    React.useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await fetch('/api/auth');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const result = await response.json();
                
                if (result.users && Array.isArray(result.users)) {
                    // Transform the data to match the expected format
                    const transformedUsers = result.users.map((user: any) => {
                        try {
                            return {
                                id: user.id || user.email,
                                name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
                                email: user.email || 'No email',
                                access: user.role === 'admin' ? ['Admin', 'Data export', 'Data import'] : 
                                        user.role === 'system_admin' ? ['System Admin', 'Full Access', 'User Management'] :
                                        user.username && user.username !== user.email ? ['Admin User', 'Data export', 'Data import'] :
                                        ['Data export'],
                                lastActive: new Date(user.last_login_at || user.created_at || new Date()).getTime(),
                                dateAdded: new Date(user.created_at || new Date()).getTime(),
                                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=random&color=fff&size=40`,
                                dealershipName: user.dealership_name || 'Unknown Dealership',
                                subscriptionStatus: user.subscription_status || 'inactive',
                                subscriptionPrice: parseFloat(user.subscription_amount) || 0,
                                phone: user.phone || 'No phone',
                                businessAddress: user.business_address || 'No address',
                                city: user.city || 'No city',
                                state: user.state || 'No state',
                                zip: user.zip || 'No zip',
                                subscriptionId: user.subscription_id || 'No subscription',
                                customerId: user.customer_id || user.id
                            };
                        } catch (error) {
                            console.error('Error transforming user:', user, error);
                            return null;
                        }
                    }).filter(Boolean);
                    
                    setUsers(transformedUsers);
                } else {
                    console.error('Failed to fetch customers:', result.error || 'Invalid response format');
                }
            } catch (error) {
                console.error('Error fetching customers:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const sortedItems = useMemo(() => {
        return filteredUsers.toSorted((a, b) => {
            const first = a[sortDescriptor.column as keyof typeof a];
            const second = b[sortDescriptor.column as keyof typeof b];

            // Handle numbers
            if (typeof first === "number" && typeof second === "number") {
                return sortDescriptor.direction === "ascending" ? first - second : second - first;
            }

            // Handle strings
            if (typeof first === "string" && typeof second === "string") {
                const result = first.localeCompare(second);
                return sortDescriptor.direction === "ascending" ? result : -result;
            }

            return 0;
        });
    }, [filteredUsers, sortDescriptor]);

    return (
        <div className="flex flex-col bg-primary dark:bg-gray-950 lg:flex-row">
            <SidebarNavigationSimple
                items={[]}
                showAccountCard={false}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
                hideLogoOnMobile={true}
                showSearchOnMobile={true}
                docsLabel="Home"
                showOnlyDocs={true}
            />


            <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-12 shadow-none lg:bg-primary dark:lg:bg-gray-950 page-transition content-area">
                <header className="sticky top-0 z-50 hidden lg:block">
                    <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700">
                        <Breadcrumbs type="button">
                            <Breadcrumbs.Item href="#">Admin</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="#">Dashboard</Breadcrumbs.Item>
                        </Breadcrumbs>
                        <div className="flex items-center gap-3">
                            {/* Admin Dark Mode Toggle */}
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
                                    <NavAccountMenu 
                                        onClose={() => setIsAccountMenuOpen(false)} 
                                        showAccountSettings={false}
                                    />
                                </Popover>
                            </DialogTrigger>
                        </div>
                    </section>
                </header>
                
                <div className="px-6 lg:px-8 py-8 pt-8 md:pt-8">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex min-w-0 flex-1 flex-col gap-4 pt-4 pb-8 lg:gap-8 lg:pt-8 lg:pb-12">
                            <div className="flex flex-col gap-3 px-4 lg:gap-4 lg:px-8">
                        <div className="flex flex-col gap-0.5 lg:gap-1">
                            <p className="text-lg font-semibold text-primary lg:text-xl xl:text-display-xs">
                                Welcome back, {user?.firstName || user?.name || 'Admin'}
                            </p>
                            <p className="text-sm text-balance text-tertiary lg:text-md">Here's an overview of your customers and subscription revenue.</p>
                        </div>
                    </div>

                <div className="flex flex-col gap-4 px-4 lg:gap-5 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                        <MetricsChart01 
                            title={newCustomers.length.toString()} 
                            subtitle="New Customers" 
                            change="12%" 
                            className="w-full" 
                        />
                        <MetricsChart01
                            title={frozenCustomers.length.toString()}
                            subtitle="Frozen"
                            trend="negative"
                            change="3%"
                            className="w-full"
                        />
                        <MetricsChart01 
                            title={offlineCustomers.length.toString()} 
                            subtitle="Offline" 
                            change="2%" 
                            className="w-full sm:col-span-2 lg:col-span-1" 
                        />
                    </div>
                </div>

                {/* Active Customers Map */}
                <div className="px-4 lg:px-8">
                    <div className="flex flex-col gap-4 rounded-xl bg-primary px-3 py-4 shadow-xs ring-1 ring-secondary ring-inset lg:gap-5 lg:p-6">
                        <div className="flex flex-col gap-3 border-b border-secondary pb-4 lg:flex-row lg:items-center lg:justify-between lg:pb-5">
                            <p className="text-base font-semibold text-primary lg:text-lg">Customer Locations</p>
                            <Button size="sm" color="secondary" className="self-start lg:hidden">
                                Report
                            </Button>
                            <Button size="md" color="secondary" className="hidden lg:inline-flex">
                                Location report
                            </Button>
                        </div>
                        <div className="flex flex-col gap-6 lg:flex-col-reverse lg:gap-16 xl:flex-row">
                            {/* Mobile Map */}
                            <div className="flex flex-1 lg:hidden">
                                <svg className="mx-auto w-full overflow-visible" height="200" viewBox="0 0 1025 483" fill="none">
                                    <image
                                        width="100%"
                                        x="0"
                                        y="0"
                                        href="https://www.untitledui.com/marketing/world-map-light-mode.svg"
                                        className="dark:hidden"
                                    />
                                    <image
                                        width="100%"
                                        x="0"
                                        y="0"
                                        href="https://www.untitledui.com/marketing/world-map-dark-mode.svg"
                                        className="not-dark:hidden"
                                    />
                                    <foreignObject width="100%" height="100%" x="0" y="0" className="overflow-visible">
                                        {users.filter(user => user.state && user.city).slice(0, 5).map((user, index) => {
                                            const statePositions: { [key: string]: { x: number; y: number } } = {
                                                'MI': { x: 550, y: 200 },
                                                'CA': { x: 150, y: 250 },
                                                'TX': { x: 400, y: 350 },
                                                'FL': { x: 600, y: 380 },
                                                'NY': { x: 650, y: 180 },
                                                'OH': { x: 580, y: 210 },
                                                'IL': { x: 500, y: 220 },
                                                'PA': { x: 620, y: 200 },
                                                'GA': { x: 580, y: 320 }
                                            };
                                            
                                            const position = statePositions[user.state] || { x: 500, y: 250 };
                                            
                                            return (
                                                <div
                                                    key={user.id}
                                                    className="absolute"
                                                    style={{
                                                        left: `${position.x}px`,
                                                        top: `${position.y}px`,
                                                        transform: 'translate(-50%, -50%)',
                                                        zIndex: 10
                                                    }}
                                                >
                                                    <div className="relative">
                                                        <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
                                                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                                                            {user.city}, {user.state}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </foreignObject>
                                </svg>
                            </div>
                            
                            {/* Desktop Map */}
                            <div className="hidden flex-1 lg:flex">
                                <svg className="mx-auto hidden w-full max-w-5xl overflow-visible lg:block" height="344" viewBox="0 0 1025 483" fill="none">
                                    <image
                                        width="100%"
                                        x="0"
                                        y="0"
                                        href="https://www.untitledui.com/marketing/world-map-light-mode.svg"
                                        className="dark:hidden"
                                    />
                                    <image
                                        width="100%"
                                        x="0"
                                        y="0"
                                        href="https://www.untitledui.com/marketing/world-map-dark-mode.svg"
                                        className="not-dark:hidden"
                                    />

                                    <foreignObject width="100%" height="100%" x="0" y="0" className="overflow-visible">
                                        {users.filter(user => user.state && user.city).slice(0, 9).map((user, index) => {
                                            // Simple mapping of US states to approximate positions
                                            const statePositions: { [key: string]: { x: number; y: number } } = {
                                                'CA': { x: 158, y: 204 },
                                                'NY': { x: 300, y: 150 },
                                                'TX': { x: 200, y: 250 },
                                                'FL': { x: 320, y: 280 },
                                                'IL': { x: 250, y: 180 },
                                                'PA': { x: 290, y: 160 },
                                                'OH': { x: 280, y: 170 },
                                                'GA': { x: 300, y: 220 },
                                                'NC': { x: 310, y: 200 },
                                                'MI': { x: 270, y: 160 },
                                                'NJ': { x: 295, y: 155 },
                                                'VA': { x: 305, y: 185 },
                                                'WA': { x: 130, y: 157 },
                                                'AZ': { x: 180, y: 220 },
                                                'TN': { x: 270, y: 210 },
                                                'IN': { x: 260, y: 175 },
                                                'MO': { x: 230, y: 200 },
                                                'MD': { x: 300, y: 170 },
                                                'WI': { x: 250, y: 150 },
                                                'CO': { x: 200, y: 190 }
                                            };

                                            const position = statePositions[user.state] || { x: 200, y: 200 };

                                            return (
                                                <div key={`${user.id}-${index}`} className="fixed" style={{ left: position.x, top: position.y }}>
                                                    <div className="group relative">
                                                        <div className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 -translate-y-[calc(100%-4px)] scale-125 opacity-0 transition duration-150 ease-in will-change-transform group-hover:pointer-events-auto group-hover:-translate-y-full group-hover:scale-130 group-hover:opacity-100 group-hover:ease-out group-focus-within:pointer-events-auto group-focus-within:-translate-y-full group-focus-within:scale-130 group-focus-within:opacity-100 group-focus-within:ease-out">
                                                            <div
                                                                id={`vector-map-pin-${index}`}
                                                                className="relative flex w-max max-w-45 flex-col items-center rounded-lg bg-primary px-4 py-3 text-center shadow-lg ring-1 ring-secondary_alt"
                                                            >
                                                                <p className="text-xs font-semibold text-primary">{user.city}, {user.state}</p>
                                                                <p className="mt-1 text-xs text-tertiary">{user.dealershipName}</p>
                                                            </div>
                                                        </div>

                                                        <button
                                                            aria-label={`View ${user.city}, ${user.state}`}
                                                            aria-describedby={`vector-map-pin-${index}`}
                                                            className="flex size-10 cursor-pointer items-center justify-center overflow-visible outline-hidden"
                                                        >
                                                            <span className="absolute size-10 rounded-full bg-fg-brand-secondary/10 transition duration-150 ease-linear group-focus-within:scale-[1.15] group-hover:scale-[1.15]" />
                                                            <span className="absolute size-6 rounded-full bg-fg-brand-secondary/20 transition duration-150 ease-linear group-focus-within:scale-[1.15] group-hover:scale-[1.15]" />
                                                            <span className="absolute size-2 rounded-full bg-fg-brand-secondary" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </foreignObject>
                                </svg>
                            </div>
                            <div className="flex w-full flex-col gap-5 xl:w-62">
                                <p className="text-display-md font-semibold text-primary">{users.length}</p>
                                <div className="flex flex-col gap-3">
                                    {Object.values(users
                                        .filter(user => user.state)
                                        .reduce((acc: { [key: string]: { state: string; city: string; count: number; dealerships: string[] } }, user) => {
                                            const key = `${user.city}, ${user.state}`;
                                            if (!acc[key]) {
                                                acc[key] = {
                                                    state: user.state,
                                                    city: user.city,
                                                    count: 0,
                                                    dealerships: []
                                                };
                                            }
                                            acc[key].count++;
                                            if (user.dealershipName && !acc[key].dealerships.includes(user.dealershipName)) {
                                                acc[key].dealerships.push(user.dealershipName);
                                            }
                                            return acc;
                                        }, {}))
                                        // Sort by count (descending) then by city name
                                        .sort((a, b) => {
                                            if (b.count !== a.count) return b.count - a.count;
                                            return a.city.localeCompare(b.city);
                                        })
                                        .slice(0, 5)
                                        .map((location, index) => {
                                            const percentage = Math.round((location.count / users.length) * 100);
                                            return (
                                                <div key={`${location.city}-${location.state}-${index}`} className="flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-primary">{location.city}, {location.state}</span>
                                                            <span className="text-sm font-medium text-primary">{percentage}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div 
                                                                className="bg-purple-600 h-2 rounded-full" 
                                                                style={{ width: `${percentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 lg:gap-5">
                    <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-8">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
                            <div className="flex items-center gap-2">
                                <p className="text-base font-semibold text-primary lg:text-lg">
                                    Customers
                                </p>
                                <span className="text-xs font-medium text-tertiary lg:text-sm">
                                    ({searchQuery ? `${filteredUsers.length} of ${users.length}` : filteredUsers.length})
                                </span>
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:overflow-visible lg:pb-0">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={`w-16 h-8 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'all' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    className={`w-16 h-8 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'active' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setActiveTab('new')}
                                    className={`w-16 h-8 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'new' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    New
                                </button>
                                <button
                                    onClick={() => setActiveTab('support')}
                                    className={`w-20 h-8 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'support' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Support
                                </button>
                                <button
                                    onClick={() => setActiveTab('canceled')}
                                    className={`w-20 h-8 text-sm font-medium rounded-md transition-colors ${
                                        activeTab === 'canceled' 
                                            ? 'bg-blue-600 text-white' 
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    Canceled
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-0 lg:px-8">
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-sm text-gray-600">Loading customers...</p>
                                </div>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">
                                        {searchQuery ? 'No customers match your search' : 'No customers found'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {searchQuery ? 'Try adjusting your search terms' : 'Customers will appear here after they sign up'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Table
                                    aria-label="Customer data"
                                    selectionMode="multiple"
                                    sortDescriptor={sortDescriptor}
                                    onSortChange={setSortDescriptor}
                                    selectedKeys={selectedKeys}
                                    onSelectionChange={setSelectedKeys}
                                    className="bg-primary"
                                >
                                    <Table.Header
                                        bordered={false}
                                        className="lg:bg-transparent lg:[&>tr>th]:bg-secondary lg:[&>tr>th:first-of-type]:rounded-l-xl lg:[&>tr>th:first-of-type]:pl-3 lg:[&>tr>th:last-of-type]:rounded-r-xl"
                                    >
                                        <Table.Head id="name" isRowHeader allowsSorting className="w-full text-xs font-semibold text-brand-secondary">
                                            {selectedKeys instanceof Set ? selectedKeys.size : 0} selected
                                        </Table.Head>
                                        <Table.Head id="subscriptionStatus" label="Status" allowsSorting className="max-lg:hidden" />
                                        <Table.Head id="subscriptionPrice" label="Amount" allowsSorting className="max-lg:hidden" />
                                        <Table.Head id="dealershipName" label="Dealership" allowsSorting className="max-lg:hidden" />
                                        <Table.Head id="phone" label="Phone" allowsSorting className="max-lg:hidden" />
                                        <Table.Head id="dateAdded" label="Date added" allowsSorting className="max-lg:hidden" />
                                        <Table.Head id="actions" />
                                    </Table.Header>

                                    <Table.Body items={sortedItems}>
                                        {(user) => (
                                            <Table.Row id={user.id} className="lg:[&>td:first-of-type]:pl-3">
                                                <Table.Cell className="text-nowrap">
                                                    <div className="flex w-max items-center gap-3">
                                                        <Avatar src={user.avatarUrl} alt={user.name} size="md" />
                                                        <div>
                                                            <p className="text-sm font-medium text-primary">{user.name}</p>
                                                            <p className="text-sm text-tertiary">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell className="text-nowrap max-lg:hidden">
                                                    <BadgeWithDot
                                                        color={user.subscriptionStatus === "active" ? "success" : user.subscriptionStatus === "past_due" ? "warning" : "gray"}
                                                        type="modern"
                                                        size="sm"
                                                    >
                                                        {user.subscriptionStatus}
                                                    </BadgeWithDot>
                                                </Table.Cell>
                                                <Table.Cell className="text-nowrap max-lg:hidden">
                                                    <div>
                                                        <p className="text-sm font-semibold text-primary">
                                                            {user.subscriptionPrice ? `$${user.subscriptionPrice}/mo` : 'No payment'}
                                                        </p>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell className="text-nowrap max-lg:hidden">
                                                    <div>
                                                        <p className="text-sm font-medium text-primary">{user.dealershipName}</p>
                                                        <p className="text-xs text-tertiary">{user.city}, {user.state}</p>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell className="text-nowrap max-lg:hidden">
                                                    <p className="text-sm text-primary">{user.phone}</p>
                                                </Table.Cell>
                                                <Table.Cell className="text-nowrap max-lg:hidden">{formatDate(user.dateAdded)}</Table.Cell>

                                                <Table.Cell className="px-4 lg:px-3">
                                                    <div className="flex items-center justify-end">
                                                        <Dropdown.Root>
                                                            <Dropdown.DotsButton />
                                                            <Dropdown.Popover className="w-48">
                                                                <Dropdown.Menu>
                                                                    <Dropdown.Item 
                                                                        icon={Edit01}
                                                                        onAction={() => {
                                                                            // TODO: Implement edit customer modal
                                                                            alert('Edit customer functionality coming soon');
                                                                        }}
                                                                    >
                                                                        Edit Customer
                                                                    </Dropdown.Item>
                                                                    <Dropdown.Item 
                                                                        icon={Copy01}
                                                                        onAction={() => {
                                                                            navigator.clipboard.writeText(user.email);
                                                                        }}
                                                                    >
                                                                        Copy Email
                                                                    </Dropdown.Item>
                                                                    {user.subscriptionId && user.subscriptionStatus === 'active' && (
                                                                        <Dropdown.Item 
                                                                            icon={PauseCircle}
                                                                            onAction={() => handleSubscriptionAction('cancel', user.id, user.subscriptionId)}
                                                                            className="text-orange-600"
                                                                        >
                                                                            {actionLoading === `cancel-${user.id}` ? 'Canceling...' : 'Cancel Subscription'}
                                                                        </Dropdown.Item>
                                                                    )}
                                                                    {user.subscriptionId && user.subscriptionStatus === 'canceled' && (
                                                                        <Dropdown.Item 
                                                                            icon={Play}
                                                                            onAction={() => handleSubscriptionAction('reactivate', user.id, user.subscriptionId)}
                                                                            className="text-green-600"
                                                                        >
                                                                            {actionLoading === `reactivate-${user.id}` ? 'Reactivating...' : 'Reactivate Subscription'}
                                                                        </Dropdown.Item>
                                                                    )}
                                                                    <Dropdown.Item 
                                                                        icon={Trash01}
                                                                        onAction={() => {
                                                                            // TODO: Implement delete customer functionality
                                                                            alert('Delete customer functionality coming soon');
                                                                        }}
                                                                        className="text-red-600"
                                                                    >
                                                                        Delete Customer
                                                                    </Dropdown.Item>
                                                                </Dropdown.Menu>
                                                            </Dropdown.Popover>
                                                        </Dropdown.Root>
                                                    </div>
                                                </Table.Cell>
                                            </Table.Row>
                                        )}
                                    </Table.Body>
                                </Table>
                                <PaginationPageMinimalCenter page={1} total={Math.ceil(filteredUsers.length / 10)} className="px-4 pt-3 lg:px-0" />
                            </>
                        )}
                    </div>
                        </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Wrap AdminPage with its own independent ThemeProvider
export default function AdminPageWithTheme() {
    return (
        <ThemeProvider 
            attribute="class" 
            value={{ dark: "dark-mode" }} 
            enableSystem={false}
            disableTransitionOnChange
        >
            <AdminPage />
        </ThemeProvider>
    );
}
