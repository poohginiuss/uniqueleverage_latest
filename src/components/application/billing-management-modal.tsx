"use client";

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/base/buttons/button';
import { Badge } from '@/components/base/badges/badges';
import { X } from '@untitledui/icons';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')
    .catch((error) => {
        console.error('Failed to load Stripe:', error);
        return null;
    });

interface PaymentMethod {
    id: string;
    type: string;
    card: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
    };
    isDefault: boolean;
}

interface BillingManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    customerId: string;
}

// Payment Form Component
const PaymentForm = ({ customerId, onSuccess, onClose }: { 
    customerId: string; 
    onSuccess: () => void;
    onClose: () => void;
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
        <div className="space-y-6">
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
                <Button
                    onClick={onClose}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    isLoading={loading}
                    disabled={!stripe}
                >
                    Add Payment Method
                </Button>
            </div>
        </div>
    );
};

export const BillingManagementModal: React.FC<BillingManagementModalProps> = ({
    isOpen,
    onClose,
    customerId,
}) => {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
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
                // Customer doesn't exist, show empty state
                setPaymentMethods([]);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setPaymentMethods([]);
        } finally {
            setLoading(false);
        }
    };

    const removePaymentMethod = async (paymentMethodId: string) => {
        try {
            const response = await fetch('/api/customer-payment-methods', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentMethodId }),
            });

            if (response.ok) {
                await fetchPaymentMethods();
            }
        } catch (error) {
            console.error('Error removing payment method:', error);
        }
    };

    const setDefaultPaymentMethod = async (paymentMethodId: string) => {
        try {
            const response = await fetch('/api/update-payment-method', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId,
                    paymentMethodId,
                }),
            });

            if (response.ok) {
                await fetchPaymentMethods();
            }
        } catch (error) {
            console.error('Error setting default payment method:', error);
        }
    };

    useEffect(() => {
        if (isOpen && customerId) {
            fetchPaymentMethods();
        }
    }, [isOpen, customerId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            
            <div className="relative w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Manage Billing
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
                    </div>
                ) : showAddForm ? (
                    <Elements stripe={stripePromise}>
                        <PaymentForm
                            customerId={customerId}
                            onSuccess={() => {
                                setShowAddForm(false);
                                fetchPaymentMethods();
                            }}
                            onClose={() => setShowAddForm(false)}
                        />
                    </Elements>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            {paymentMethods.length === 0 ? (
                                <div className="text-center py-8">
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
                                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
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
                                                <Badge color="success"  size="sm">
                                                    Default
                                                </Badge>
                                            )}
                                            {!pm.isDefault && (
                                                <button
                                                    onClick={() => setDefaultPaymentMethod(pm.id)}
                                                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    Set Default
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removePaymentMethod(pm.id)}
                                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <Button
                                onClick={() => setShowAddForm(true)}
                                disabled={customerId === 'cus_dummy_123' || customerId === 'cus_default_123'}
                                className="w-full"
                            >
                                Add New Payment Method
                            </Button>
                            {(customerId === 'cus_dummy_123' || customerId === 'cus_default_123') && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                                    Demo accounts cannot add payment methods
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};