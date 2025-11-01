"use client";

import { useTheme } from "next-themes";
import { SystemTheme } from "@/providers/system-theme";
import { AuthHandler } from "@/components/auth/auth-handler";
import { useState, useEffect, Suspense } from "react";
import {
    Flag05,
    LayoutAlt01,
    MessageChatCircle,
    Settings01,
    Star06,
    ChevronDown,
    User01,
    Building02,
    CreditCard01,
    ArrowLeft
} from "@untitledui/icons";
import { FeaturedCardReferralLink } from "@/components/application/app-navigation/base-components/featured-cards.demo";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { BadgeWithDot, BadgeWithIcon, Badge } from "@/components/base/badges/badges";
import { ULIntroPage } from "@/components/landing/docs/intro-content";
import { Button as AriaButton, DialogTrigger, Popover } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Avatar } from "@/components/base/avatar/avatar";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
// import { BillingManagementModal } from "@/components/application/billing-management-modal";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')
    .catch((error) => {
        console.error('Failed to load Stripe:', error);
        return null;
    });

type AccountData = {
    firstName: string;
    lastName: string;
    email: string;
    dealershipName: string;
    phone: string;
    website: string;
    businessAddress: string;
    city: string;
    state: string;
    zip: string;
    billingSame: boolean;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingZip: string;
    subscriptionStatus: 'active' | 'inactive' | 'pending' | 'past_due' | 'canceled' | 'unpaid';
    subscriptionId?: string;
    customerId?: string;
    createdAt?: string;
    verified?: boolean;
    avatarUrl?: string;
};

// Account Settings Page Component
const AccountSettingsPage = ({ accountData }: { accountData: AccountData | null }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<AccountData | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [showBillingManagement, setShowBillingManagement] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<{ last4: string; exp_month: number; exp_year: number; brand: string } | null>(null);
    
    // Avatar upload state
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarMessage, setAvatarMessage] = useState('');
    const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);

    // Initialize form data when accountData changes
    useEffect(() => {
        if (accountData) {
            setFormData({ ...accountData });
            setCurrentAvatar(accountData.avatarUrl || null);
        }
    }, [accountData]);

    // Avatar upload handler
    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAvatarUploading(true);
        setAvatarMessage('');

        const uploadFormData = new FormData();
        uploadFormData.append('avatar', file);

        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                setAvatarMessage('Not authenticated. Please log in again.');
                setAvatarUploading(false);
                return;
            }

            const response = await fetch('/api/account/avatar', {
                method: 'POST',
                headers: {
                    'x-user-email': userEmail,
                },
                body: uploadFormData,
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentAvatar(data.avatarUrl);
                setAvatarMessage('Avatar updated successfully!');
                
                // Update formData to reflect the new avatar
                if (formData) {
                    setFormData({ ...formData, avatarUrl: data.avatarUrl });
                }
                
                // Update localStorage to persist the change
                const savedData = localStorage.getItem('accountData');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    parsedData.avatarUrl = data.avatarUrl;
                    localStorage.setItem('accountData', JSON.stringify(parsedData));
                }
                
                // Clear message after 3 seconds
                setTimeout(() => setAvatarMessage(''), 3000);
            } else {
                setAvatarMessage(data.error || 'Failed to upload avatar');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            setAvatarMessage('Failed to upload avatar');
        } finally {
            setAvatarUploading(false);
        }
    };

    // Avatar removal handler
    const handleAvatarRemove = async () => {
        setAvatarUploading(true);
        setAvatarMessage('');

        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                setAvatarMessage('Not authenticated. Please log in again.');
                setAvatarUploading(false);
                return;
            }

            const response = await fetch('/api/account/avatar', {
                method: 'DELETE',
                headers: {
                    'x-user-email': userEmail,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentAvatar(null);
                setAvatarMessage('Avatar removed successfully!');
                
                // Update formData to reflect the removed avatar
                if (formData) {
                    setFormData({ ...formData, avatarUrl: undefined });
                }
                
                // Update localStorage to persist the change
                const savedData = localStorage.getItem('accountData');
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    parsedData.avatarUrl = null;
                    localStorage.setItem('accountData', JSON.stringify(parsedData));
                }
                
                // Clear message after 3 seconds
                setTimeout(() => setAvatarMessage(''), 3000);
            } else {
                setAvatarMessage(data.error || 'Failed to remove avatar');
            }
        } catch (error) {
            console.error('Avatar removal error:', error);
            setAvatarMessage('Failed to remove avatar');
        } finally {
            setAvatarUploading(false);
        }
    };

    // Fetch payment method when accountData loads
    useEffect(() => {
        const fetchPaymentMethod = async () => {
            if (accountData?.customerId && !accountData.customerId.startsWith('cus_dummy') && !accountData.customerId.startsWith('cus_default')) {
                try {
                    console.log('Fetching payment methods for customer:', accountData.customerId);
                    const response = await fetch(`/api/customer-payment-methods?customerId=${accountData.customerId}`);
                    console.log('Payment methods response:', response.status);
                    if (response.ok) {
                        const data = await response.json();
                        console.log('Payment methods data:', data);
                        const { paymentMethods } = data;
                        console.log('All payment methods:', paymentMethods);
                        // Find the default payment method, or fall back to the first one
                        let defaultPM = paymentMethods.find((pm: any) => pm.isDefault);
                        if (!defaultPM && paymentMethods.length > 0) {
                            defaultPM = paymentMethods[0]; // Use first payment method as fallback
                            console.log('No default found, using first payment method:', defaultPM);
                        }
                        console.log('Selected payment method:', defaultPM);
                        if (defaultPM) {
                            setPaymentMethod({
                                last4: defaultPM.card.last4,
                                exp_month: defaultPM.card.expMonth,
                                exp_year: defaultPM.card.expYear,
                                brand: defaultPM.card.brand
                            });
                        } else {
                            console.log('No payment methods found');
                        }
                    } else {
                        const errorData = await response.json();
                        console.error('Failed to fetch payment methods:', response.status, errorData);
                        // You could set an error state here to show to the user
                    }
                } catch (error) {
                    console.error('Failed to fetch payment method:', error);
                }
            } else {
                console.log('Skipping payment method fetch for customer:', accountData?.customerId);
            }
        };

        fetchPaymentMethod();
    }, [accountData?.customerId]);

    const handleSave = async () => {
        if (!formData || !accountData?.customerId) return;
        
        setSaving(true);
        setSaveMessage('');
        
        try {
            const response = await fetch('/api/account', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: accountData.customerId,
                    updates: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                        businessAddress: formData.businessAddress,
                        city: formData.city,
                        state: formData.state,
                        zip: formData.zip,
                    }
                })
            });

            if (response.ok) {
                // Update localStorage with saved data
                localStorage.setItem('accountData', JSON.stringify(formData));
                setSaveMessage('Account updated successfully!');
                setIsEditing(false);
            } else {
                setSaveMessage('Failed to update account. Please try again.');
            }
        } catch (error) {
            console.error('Error saving account:', error);
            setSaveMessage('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (field: keyof AccountData, value: string) => {
        if (formData) {
            setFormData({ ...formData, [field]: value });
        }
    };

    if (!accountData) {
        return (
            <div className="flex items-start px-4 py-16 lg:px-8">
                <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
                    <div className="size-full text-tertiary">
                        <div className="text-center py-12">
                            <h2 className="text-xl font-semibold text-primary mb-4">No Account Found</h2>
                            <p className="text-tertiary mb-6">You need to create an account to access these settings.</p>
                            <a 
                                href="/signup" 
                                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white ring-1 ring-inset ring-blue-600 hover:bg-blue-700 hover:shadow-sm transition-all"
                            >
                                Create Account
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex items-start px-4 py-16 lg:px-8">
            <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
                <div className="size-full text-tertiary">
                    {/* Account header */}
                    <div className="mb-10">
                        <div className="mb-6">
                            <div
                                className="relative flex shrink-0 items-center justify-center bg-primary_alt ring-1 ring-inset before:absolute before:inset-1 before:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_3px_3px_0px_rgba(0,0,0,0.09),1px_8px_5px_0px_rgba(0,0,0,0.05),2px_21px_6px_0px_rgba(0,0,0,0),0px_0px_0px_1px_rgba(0,0,0,0.08),1px_13px_5px_0px_rgba(0,0,0,0.01),0px_-2px_2px_0px_rgba(0,0,0,0.13)_inset] before:ring-1 before:ring-secondary_alt size-14 rounded-[14px] before:rounded-[10px] text-fg-secondary ring-primary dark:ring-secondary dark:before:opacity-0"
                                data-featured-icon="true"
                            >
                                <div className="z-10">
                                    <User01 className="size-6 text-utility-gray-500" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <h1 className="max-w-3xl text-2xl font-semibold text-primary">
                                Account Settings
                            </h1>
                        </div>

                        <p className="typography mt-3 max-w-3xl text-base">
                            Manage your account details, business information, and subscription settings all in one place.
                        </p>
                    </div>

                    <Divider />

                    {/* Account Status */}
                    <Section id="account-overview" title="Overview">
                        <p>Your account information and membership details.</p>
                        
                        <div className="mt-8 space-y-6">
                            <div>
                                <p className="text-sm text-primary mb-1">
                                    {accountData.firstName} {accountData.lastName}
                                </p>
                                <p className="text-tertiary">{accountData.email}</p>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                                <div>
                                    <p className="text-sm font-medium text-primary mb-1">Dealership</p>
                                    <p className="text-tertiary">{accountData.dealershipName}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-primary mb-1">Phone</p>
                                    <p className="text-tertiary">{accountData.phone || 'Not provided'}</p>
                                </div>
                                
                                <div>
                                    <p className="text-sm font-medium text-primary mb-1">Location</p>
                                    <p className="text-tertiary">{accountData.city}, {accountData.state}</p>
                                </div>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-primary mb-1">Member Since</p>
                                <p className="text-tertiary">
                                    {new Date(accountData.createdAt || '').toLocaleDateString('en-US', { 
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            
                            {!accountData.verified && (
                                <div className="pt-4">
                                    <button className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 ring-1 ring-yellow-200 dark:ring-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                        Verify Email Address
                                    </button>
                                </div>
                            )}
                        </div>
                    </Section>

                    <Divider />

                    {/* Avatar Upload */}
                    <Section id="avatar" title="Profile Picture">
                        <p>Upload a profile picture that will appear in your account settings and throughout the application.</p>
                        
                        <div className="mt-8 space-y-6">
                            {/* Current Avatar Display */}
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="min-w-48 min-h-32 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                        {currentAvatar ? (
                                            <img 
                                                src={currentAvatar} 
                                                alt="Profile" 
                                                className="max-w-full max-h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                <span className="text-white text-lg font-semibold">
                                                    {accountData?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Upload overlay */}
                                    <label className="absolute inset-0 cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                            disabled={avatarUploading}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                    </label>
                                </div>
                                
                                <div className="flex-1">
                                    <h4 className="text-lg font-medium text-primary mb-2">Profile Picture</h4>
                                    <p className="text-sm text-tertiary mb-4">
                                        Upload a JPEG, PNG, GIF, or WebP image. Maximum file size is 5MB.
                                    </p>
                                    
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            {avatarUploading ? 'Uploading...' : 'Choose File'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                                disabled={avatarUploading}
                                            />
                                        </label>
                                        
                                        {currentAvatar && (
                                            <button
                                                onClick={handleAvatarRemove}
                                                disabled={avatarUploading}
                                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* Status Message */}
                                    {avatarMessage && (
                                        <div className={`mt-3 text-sm ${
                                            avatarMessage.includes('successfully') 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {avatarMessage}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Divider />

                    {/* Subscription Details */}
                    <Section id="subscription" title="Subscription Details">
                        <p>Your subscription information and payment details.</p>
                        
                        <div className="space-y-6 mt-8">
                            {/* Plan Overview */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="text-lg font-semibold text-primary">The Basic</h4>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            accountData?.subscriptionStatus === 'active' 
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : accountData?.subscriptionStatus === 'past_due'
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                : accountData?.subscriptionStatus === 'canceled' || accountData?.subscriptionStatus === 'inactive'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : accountData?.subscriptionStatus === 'unpaid'
                                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                        }`}>
                                            {accountData?.subscriptionStatus === 'active' 
                                                ? 'Active'
                                                : accountData?.subscriptionStatus === 'past_due'
                                                ? 'Past Due'
                                                : accountData?.subscriptionStatus === 'canceled' || accountData?.subscriptionStatus === 'inactive'
                                                ? 'Canceled'
                                                : accountData?.subscriptionStatus === 'unpaid'
                                                ? 'Unpaid'
                                                : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-tertiary">Full access to all features and integrations</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">$99</p>
                                    <p className="text-sm text-tertiary">per month</p>
                                </div>
                            </div>

                            {/* Subscription Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm font-medium text-tertiary block mb-2">Payment Method</label>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-14 bg-primary ring-1 ring-secondary rounded flex items-center justify-center">
                                            <CreditCard01 className="h-5 w-5 text-secondary" />
                                        </div>
                                        <div>
                                            {paymentMethod ? (
                                                <>
                                                    <p className="text-sm font-medium text-primary">•••• •••• •••• {paymentMethod.last4}</p>
                                                    <p className="text-xs text-tertiary">Expires {paymentMethod.exp_month.toString().padStart(2, '0')}/{paymentMethod.exp_year}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-medium text-primary">•••• •••• •••• ••••</p>
                                                    <p className="text-xs text-tertiary">Loading...</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-tertiary block mb-2">Member Since</label>
                                    <p className="text-sm text-primary">
                                        {new Date(accountData.createdAt || '').toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-tertiary block mb-2">Next Billing</label>
                                    <p className="text-sm text-primary">
                                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        })}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setShowBillingManagement(!showBillingManagement)}
                                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                    <CreditCard01 className="h-4 w-4" />
                                    {showBillingManagement ? 'Hide Billing' : 'Manage Billing'}
                                </button>
                                
                                <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                    Download Invoices
                                </button>
                            </div>

                            {/* Billing Management */}
                            {showBillingManagement && (
                                <div className="pt-6 border-t border-secondary">
                                    <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-primary mb-2">Payment Methods</h4>
                                        <p className="text-sm text-tertiary">Manage your payment methods and billing information</p>
                                    </div>
                                    
                                    {accountData?.customerId && (
                                        <Elements stripe={stripePromise}>
                                            <InlineBillingManagement customerId={accountData.customerId} />
                                        </Elements>
                                    )}
                                </div>
                            )}
                        </div>
                    </Section>

                    <Divider />

                    {/* Personal Information */}
                    <Section id="personal-info" title="Personal Information">
                        <p>Manage your personal details and contact information.</p>
                        
                        <div className="space-y-6 mt-8">
                            <div className="space-y-4">
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="text-sm text-tertiary hover:text-primary transition-colors"
                                    >
                                        {isEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">First Name</label>
                                    <Input
                                        value={formData?.firstName || ''}
                                        onChange={(e) => handleInputChange('firstName', e)}
                                        isDisabled={!isEditing}
                                        placeholder="John"
                                        className={`bg-primary ring-1 ring-inset ring-secondary ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Last Name</label>
                                    <Input
                                        value={formData?.lastName || ''}
                                        onChange={(e) => handleInputChange('lastName', e)}
                                        isDisabled={!isEditing}
                                        placeholder="Smith"
                                        className={`bg-primary ring-1 ring-inset ring-secondary ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Email Address</label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            value={formData?.email || ''}
                                            onChange={(e) => handleInputChange('email', e)}
                                            isDisabled={!isEditing}
                                            placeholder="john.smith@email.com"
                                            type="email"
                                            className={`flex-1 bg-primary ring-1 ring-inset ring-secondary ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                        />
                                        {!accountData.verified && (
                                            <Badge color="warning" size="sm">
                                                Unverified
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Phone Number</label>
                                    <Input
                                        value={formData?.phone || ''}
                                        onChange={(e) => handleInputChange('phone', e)}
                                        isDisabled={!isEditing}
                                        placeholder="(555) 123-4567"
                                        type="tel"
                                        className={`bg-primary ring-1 ring-inset ring-secondary ${!isEditing ? 'cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                            </div>
                            
                            {isEditing && (
                                <div className="flex items-center justify-between pt-4 border-t border-secondary">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-sm text-tertiary">Changes will be saved to your account</p>
                                        {saveMessage && (
                                            <p className={`text-sm ${saveMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                                                {saveMessage}
                                            </p>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white ring-1 ring-inset ring-blue-600 hover:bg-blue-700 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </Section>

                    <Divider />

                    {/* Business Information */}
                    <Section id="business-info" title="Business Information">
                        <p>Your dealership details and business information.</p>
                        
                        <div className="space-y-6 mt-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Dealership Name</label>
                                    <Input
                                        value={accountData.dealershipName}
                                        isDisabled={true}
                                        placeholder="Auto Dealership"
                                        className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Website</label>
                                    <Input
                                        value={accountData.website}
                                        isDisabled={true}
                                        placeholder="https://yourdealership.com"
                                        type="url"
                                        className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-primary block">Business Address</label>
                                    <Input
                                        value={accountData.businessAddress}
                                        isDisabled={true}
                                        placeholder="123 Main Street"
                                        className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-primary block">City</label>
                                        <Input
                                            value={accountData.city}
                                            isDisabled={true}
                                            placeholder="Anytown"
                                            className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-primary block">State</label>
                                        <Input
                                            value={accountData.state}
                                            isDisabled={true}
                                            placeholder="CA"
                                            className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-primary block">ZIP Code</label>
                                        <Input
                                            value={accountData.zip}
                                            isDisabled={true}
                                            placeholder="90210"
                                            className="bg-primary ring-1 ring-inset ring-secondary cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Section>


                </div>
            </main>
            
            {/* Right rail: On this page */}
            <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
            <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
                        <div className="flex items-center gap-1.5">
                            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-fg-quaternary">
                                <path d="M3 12h18M3 6h18M3 18h12"></path>
                            </svg>
                            <p className="text-xs font-semibold text-primary">On this page</p>
                        </div>

                        <nav className="mt-4">
                            <ol className="flex flex-col gap-2 border-l border-secondary pl-3">
                            {[
                                { id: "account-overview", label: "Overview" },
                                { id: "subscription", label: "Subscription Details" },
                                { id: "personal-info", label: "Personal Information" },
                                { id: "business-info", label: "Business Information" },
                            ].map((t) => (
                                    <li key={t.id}>
                                        <a href={`#${t.id}`} className="text-sm font-semibold text-quaternary hover:text-brand-secondary">
                                            {t.label}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                  </div>
              </aside>

          </div>
      );
  };

// Add Payment Method Form Component
const AddPaymentMethodForm = ({ customerId, onSuccess, onCancel }: { 
    customerId: string; 
    onSuccess: () => void;
    onCancel: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        if (!stripe || !elements) {
            setError('Payment system not loaded');
            setLoading(false);
            return;
        }

        try {
            // Skip for dummy customer IDs
            if (customerId === 'cus_dummy_123' || customerId === 'cus_default_123') {
                setError('Cannot add payment methods for demo accounts. Please use a real account.');
                setLoading(false);
                return;
            }

            // Create setup intent
            const response = await fetch('/api/create-setup-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId }),
            });

            const { clientSecret } = await response.json();

            if (!response.ok) {
                throw new Error('Failed to create setup intent');
            }

            // Confirm setup intent with card element
            const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement)!,
                },
            });

            if (stripeError) {
                setError(stripeError.message || 'Setup failed');
            } else if (setupIntent.status === 'succeeded') {
                // Set as default payment method
                await fetch('/api/update-payment-method', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customerId,
                        paymentMethodId: setupIntent.payment_method,
                    }),
                });

                onSuccess();
            }
        } catch (err) {
            setError('Setup failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Card Number
                    </label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                        <CardNumberElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '16px',
                                        color: '#424770',
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Expiration Date
                        </label>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                            <CardExpiryElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            CVC
                        </label>
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
                            <CardCvcElement
                                options={{
                                    style: {
                                        base: {
                                            fontSize: '16px',
                                            color: '#424770',
                                            '::placeholder': {
                                                color: '#aab7c4',
                                            },
                                        },
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-3">
                <button
                    onClick={onCancel}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={loading || !stripe}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white ring-1 ring-inset ring-blue-600 hover:bg-blue-700 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Adding...' : 'Add Payment Method'}
                </button>
            </div>
        </div>
    );
};

// Inline Billing Management Component
const InlineBillingManagement = ({ customerId }: { customerId: string }) => {
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    const fetchPaymentMethods = async () => {
        setLoading(true);
        try {
            // Skip if dummy customer ID
            if (customerId === 'cus_dummy_123' || customerId === 'cus_default_123') {
                setPaymentMethods([]);
                setLoading(false);
                return;
            }

            const response = await fetch(`/api/customer-payment-methods?customerId=${customerId}`);
            if (response.ok) {
                const { paymentMethods } = await response.json();
                setPaymentMethods(paymentMethods || []);
            } else {
                setPaymentMethods([]);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (customerId) {
            fetchPaymentMethods();
        }
    }, [customerId]);

    return (
        <div className="space-y-6">
            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Payment Methods List */}
                    <div className="space-y-3">
                        {paymentMethods.length === 0 ? (
                            <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    No payment methods on file
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {customerId === 'cus_dummy_123' || customerId === 'cus_default_123' 
                                        ? 'This is a demo account. Sign up with real data to manage billing.'
                                        : 'Add a payment method to manage your billing'
                                    }
                                </p>
                            </div>
                        ) : (
                            paymentMethods.map((pm) => (
                                <div
                                    key={pm.id}
                                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {pm.card.brand.toUpperCase().substring(0, 2)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                •••• •••• •••• {pm.card.last4}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Expires {pm.card.expMonth}/{pm.card.expYear}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {pm.isDefault && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                Default
                                            </span>
                                        )}
                                        {!pm.isDefault && (
                                            <button className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                Set Default
                                            </button>
                                        )}
                                        <button className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Payment Method Button */}
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        {showAddForm ? (
                            <AddPaymentMethodForm 
                                customerId={customerId}
                                onSuccess={() => {
                                    setShowAddForm(false);
                                    fetchPaymentMethods();
                                }}
                                onCancel={() => setShowAddForm(false)}
                            />
                        ) : (
                            <button
                                onClick={() => setShowAddForm(true)}
                                disabled={customerId === 'cus_dummy_123' || customerId === 'cus_default_123'}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white ring-1 ring-inset ring-blue-600 hover:bg-blue-700 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add New Payment Method
                            </button>
                        )}
                        {(customerId === 'cus_dummy_123' || customerId === 'cus_default_123') && !showAddForm && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                                Demo accounts cannot add payment methods
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper components matching ULIntroPage styling
function Divider() {
    return <hr className="my-12 border-t-2 border-border-secondary" />;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
    return (
        <section id={id} className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-primary">
                <a href={`#${id}`}>{title}</a>
            </h2>
            <div className="typography prose prose-invert max-w-none mt-3 not-prose:text-base">
                {children}
            </div>
        </section>
    );
}

export default () => {
    return (
        <SystemTheme>
            <DocsIntroductionPage />
        </SystemTheme>
    );
};

const DocsIntroductionPage = () => {
    const { theme, setTheme } = useTheme();
    const [currentView, setCurrentView] = useState<'intro' | 'account'>('intro');
    const [accountData, setAccountData] = useState<AccountData | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
    // Check if user came from account button (via URL parameter) or account page
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const accountParam = urlParams.get('account');
        
        // Show account view if URL parameter is set OR if we're on the account page
        if (accountParam === 'settings' || window.location.pathname === '/docs/account') {
            setCurrentView('account');
        }
    }, []);
    useEffect(() => {
        const loadAccountData = async () => {
            setLoading(true);
            
            try {
                // Check localStorage first (from signup flow)
                const savedData = localStorage.getItem('accountData');
                console.log('localStorage accountData:', savedData);
                if (savedData) {
                    const parsedData = JSON.parse(savedData);
                    console.log('Parsed accountData:', parsedData);
                    setAccountData(parsedData);
                    
                    // If we have a real customerId (not dummy), fetch fresh data from Stripe
                    if (parsedData.customerId && !parsedData.customerId.startsWith('cus_dummy') && !parsedData.customerId.startsWith('cus_default')) {
                        const response = await fetch(`/api/account?customerId=${parsedData.customerId}`);
                        if (response.ok) {
                            const { data } = await response.json();
                            setAccountData(data);
                            // Update localStorage with fresh data
                            localStorage.setItem('accountData', JSON.stringify(data));
                        }
                    }
                } else {
                    // No account data found in localStorage - try to fetch from API using logged-in user's email
                    console.log('No account data found in localStorage, checking if user is logged in...');
                    const userEmail = localStorage.getItem('userEmail');
                    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                    
                    if (isLoggedIn && userEmail) {
                        console.log('User is logged in, fetching account data for:', userEmail);
                        try {
                            const response = await fetch(`/api/account?email=${encodeURIComponent(userEmail)}`);
                            if (response.ok) {
                                const { data } = await response.json();
                                console.log('Fetched account data from API:', data);
                                setAccountData(data);
                                // Store in localStorage for future use
                                localStorage.setItem('accountData', JSON.stringify(data));
                            } else {
                                console.error('Failed to fetch account data from API:', response.status);
                                setAccountData(null);
                            }
                        } catch (error) {
                            console.error('Error fetching account data from API:', error);
                            setAccountData(null);
                        }
                    } else {
                        console.log('User not logged in or no email found');
                        setAccountData(null);
                    }
                }
            } catch (error) {
                console.error('Failed to load account data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadAccountData();
    }, []);

    return (
        <>
            <Suspense fallback={null}>
                <AuthHandler />
            </Suspense>
        <div className="flex flex-col lg:flex-row">
            <SidebarNavigationSimple
                activeUrl={currentView === 'intro' ? "/docs/introduction" : "/docs/introduction"}
                items={[
                    {
                        label: "Getting started",
                        href: "/",
                        items: [
                            { label: "Introduction", href: "/docs/introduction", icon: Star06},
                            { label: "Request Feed", href: "/docs/request-feeds", icon: Flag05},
                        ],
                    },
                    {
                        label: "Partners",
                        href: "/projects",
                        items: [
                            { label: "Integrations", href: "/docs/integrations" },
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
            <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-12 shadow-none lg:bg-primary dark:lg:bg-gray-950 page-transition content-area">
                <header className="max-lg:hidden sticky top-0 z-50 ">
                    <section
                        className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700"
                    >
                        <Breadcrumbs type="button">
                            <Breadcrumbs.Item href="#">Docs</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="#">Getting started</Breadcrumbs.Item>
                            <Breadcrumbs.Item href="#">{currentView === 'intro' ? 'Introduction' : 'Account Settings'}</Breadcrumbs.Item>
                        </Breadcrumbs>
                        <div className="flex items-center gap-3">
                            {/* Dark Mode Toggle - Desktop Only */}
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
                                    />
                                </Popover>
                            </DialogTrigger>
                        </div>
                    </section>
                </header>
                
                {/* Conditional content based on current view */}
                {currentView === 'intro' ? (
                <ULIntroPage />
                ) : (
                    <AccountSettingsPage 
                        accountData={accountData}
                    />
                )}
            </main>
        </div>
        </>
    );
};