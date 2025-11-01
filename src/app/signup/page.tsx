"use client";

import React, { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select } from "@/components/base/select/select";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal-2nd";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')
    .catch((error) => {
        console.error('Failed to load Stripe:', error);
        return null;
    });

// Payment Form Component
const PaymentForm = ({ formData, onSuccess, onBack }: { 
    formData: any, 
    onSuccess: () => void, 
    onBack: () => void 
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
            // Create payment intent
            console.log('Sending form data:', formData);
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ formData }),
            });

            const responseData = await response.json();
            console.log('Payment response:', responseData);

            if (!response.ok) {
                throw new Error(responseData.error || responseData.details || 'Failed to create payment intent');
            }

            const { clientSecret, customerId, subscriptionId, cardholderName } = responseData;

            // Confirm payment with card element
            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardNumberElement)!,
                    billing_details: {
                        name: `${formData.firstName} ${formData.lastName}`,
                        email: formData.email,
                        address: {
                            line1: formData.businessAddress,
                            city: formData.city,
                            state: formData.state,
                            postal_code: formData.zip,
                            country: 'US',
                        },
                    },
                },
                save_payment_method: true,
                setup_future_usage: 'off_session',
            });

            if (stripeError) {
                setError(stripeError.message || 'Payment failed');
            } else if (paymentIntent.status === 'succeeded') {
                // Create account data object
                const accountData = {
                    ...formData,
                    subscriptionStatus: 'active',
                    subscriptionId: subscriptionId,
                    customerId: customerId,
                    createdAt: new Date().toISOString(),
                    verified: false
                };

                // Save to localStorage for Account Settings
                localStorage.setItem('accountData', JSON.stringify(accountData));

                // Save account data to backend (if needed)
                try {
                    await fetch('/api/account', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            userId: formData.email, // Use email as userId
                            data: accountData
                        })
                    });
                } catch (error) {
                    console.error('Failed to save account data:', error);
                }

                // Create user in MySQL database
                try {
                    await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'register',
                            email: formData.email,
                            password: 'temp_password_' + Date.now(), // Temporary password, will be set during email verification
                            firstName: formData.firstName,
                            lastName: formData.lastName,
                            // Additional customer data
                            dealershipName: formData.dealershipName,
                            phone: formData.phone,
                            website: formData.website,
                            businessAddress: formData.businessAddress,
                            city: formData.city,
                            state: formData.state,
                            zip: formData.zip,
                            subscriptionStatus: 'active',
                            subscriptionId: subscriptionId,
                            customerId: customerId,
                            subscriptionAmount: 99.00,
                            subscriptionProductName: 'The Basic Plan',
                            subscriptionCurrency: 'USD',
                            verified: false,
                            role: 'customer'
                        })
                    });
                } catch (error) {
                    console.error('Failed to create MySQL user:', error);
                }

                // Send verification email automatically
                try {
                    fetch('/api/send-verification-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            email: formData.email
                        })
                    });
                } catch (error) {
                    console.error('Failed to send verification email:', error);
                }
                
                // Move to email verification step
                onSuccess();
            }
        } catch (err) {
            setError('Payment processing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3 md:space-y-4">
            <div className="space-y-3 md:space-y-4">
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                        Card Number
                    </label>
                    <div className="p-2 md:p-3 border border-gray-300 rounded-lg">
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
                                placeholder: 'Card number'
                            }}
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                            Expiry Date
                        </label>
                        <div className="p-2 md:p-3 border border-gray-300 rounded-lg">
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
                                    placeholder: 'MM/YY'
                                }}
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                            CVC
                        </label>
                        <div className="p-2 md:p-3 border border-gray-300 rounded-lg">
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
                                    placeholder: 'CVC'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            {error && (
                <div className="text-red-600 text-xs md:text-sm">{error}</div>
            )}
            
            <div className="flex gap-2 md:gap-3">
                <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!stripe || loading}
                    className="w-full"
                >
                    {loading ? 'Processing...' : 'Complete Payment'}
                </Button>
            </div>
        </div>
    );
};

export default function SignupPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [editingEmail, setEditingEmail] = useState(false);
    const [stripeLoaded, setStripeLoaded] = useState(false);

    // Check if Stripe is loaded
    React.useEffect(() => {
        stripePromise.then((stripe) => {
            setStripeLoaded(stripe !== null);
        });
    }, []);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dealershipName: '',
        phone: '',
        website: '',
        businessAddress: '',
        city: '',
        state: '',
        zip: '',
        billingSame: true,
        billingAddress: '',
        billingCity: '',
        billingState: '',
        billingZip: ''
    });

    // Form validation
    const isFormValid = React.useMemo(() => {
        // Check required fields
        const requiredFields = [
            formData.firstName,
            formData.lastName,
            formData.email,
            formData.dealershipName,
            formData.phone,
            formData.website,
            formData.businessAddress,
            formData.city,
            formData.state,
            formData.zip
        ];

        // Check if all required fields are filled
        const allRequiredFilled = requiredFields.every(field => field.trim() !== '');

        // Check email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validEmail = emailRegex.test(formData.email);

        // Check phone format (should be formatted like (XXX) XXX-XXXX)
        const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
        const validPhone = phoneRegex.test(formData.phone);

        // Check website format (should start with http:// or https://)
        const websiteRegex = /^https?:\/\/.+/;
        const validWebsite = websiteRegex.test(formData.website);

        // Check zip code format (5 digits)
        const zipRegex = /^\d{5}$/;
        const validZip = zipRegex.test(formData.zip);

        // If billing is different, check billing fields
        let billingValid = true;
        if (!formData.billingSame) {
            const billingFields = [
                formData.billingAddress,
                formData.billingCity,
                formData.billingState,
                formData.billingZip
            ];
            const allBillingFilled = billingFields.every(field => field.trim() !== '');
            const validBillingZip = zipRegex.test(formData.billingZip);
            billingValid = allBillingFilled && validBillingZip;
        }

        return allRequiredFilled && validEmail && validPhone && validWebsite && validZip && billingValid;
    }, [formData]);

    const formatPhoneNumber = (value: string) => {
        // Remove all non-numeric characters
        const phoneNumber = value.replace(/\D/g, '');
        
        // Format as (XXX) XXX-XXXX
        if (phoneNumber.length <= 3) {
            return phoneNumber;
        } else if (phoneNumber.length <= 6) {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        } else {
            return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
        }
    };

    const formatWebsite = (value: string) => {
        // If it doesn't start with http:// or https://, add https://
        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
            return `https://${value}`;
        }
        return value;
    };

    const handleInputChange = (value: string, name?: string) => {
        if (!name) return;
        
        let formattedValue = value;
        
        // Apply formatting based on field type
        if (name === 'phone') {
            formattedValue = formatPhoneNumber(value);
        } else if (name === 'website') {
            formattedValue = formatWebsite(value);
        }
        
        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleNextStep = () => {
        if (currentStep < 3 && isFormValid) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission
        console.log('Form submitted:', formData);
    };

    return (
        <Elements stripe={stripePromise}>
            <section className="min-h-screen overflow-hidden bg-gray-50 px-3 py-6 md:px-8 flex items-start justify-center pt-8 md:pt-12 lg:pt-20 pb-8">
            <div className="mx-auto flex w-full flex-col gap-3 md:gap-4 max-w-4xl pb-8">
                <div className="flex flex-col items-center gap-3 md:gap-4 text-center">
                    <div className="relative">
                        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                        <a href="/" className="relative z-10 block">
                            <UntitledLogoMinimal className="h-12 w-12 md:h-14 md:w-14 hover:opacity-80 transition-opacity" />
                        </a>
                    </div>
                    <div className="z-10 flex flex-col gap-1">
                        <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-900">Create your account</h1>
                        <p className="text-xs md:text-sm text-gray-600">Please fill out the form below to get started.</p>
                    </div>
                </div>

                <div className="flex justify-center items-center gap-1 text-center">
                    <span className="text-xs md:text-sm text-gray-600">Already have an account?</span>
                    <a href="/login">
                        <Button color="link-color" size="sm" className="p-0 h-auto text-xs">
                            Log in
                        </Button>
                    </a>
                </div>

                {/* Pricing Summary Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 mb-2 md:mb-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0">
                        <div className="flex-1">
                            <h2 className="text-base md:text-lg lg:text-2xl font-semibold text-gray-900">
                                Unique Leverage Software Suite
                            </h2>
                            <div className="flex items-center mt-1 md:mt-2">
                                <svg className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-green-500 mr-1 md:mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-600 font-medium text-xs md:text-sm">Promo Applied: ONLINE99, 3 months for $99</span>
                            </div>
                            <p className="text-gray-600 text-xs md:text-sm mt-1">
                                Billed monthly after promo ends. No contracts or hidden fees!
                            </p>
                            <div className="mt-1 md:mt-2 text-xs md:text-sm text-gray-700">
                                <p className="font-medium">Includes:</p>
                                <ul className="mt-1 space-y-0.5">
                                    <li>• Posting Platform - Marketplace automation for dealers</li>
                                    <li>• Ad Wizard - AI-powered ad creation and optimization</li>
                                    <li>• Inventory Management - VSP integration and feed management</li>
                                    <li>• Analytics Dashboard - Performance tracking and ROI insights</li>
                                </ul>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">Total: <span className="text-blue-600">$99</span></div>
                            <p className="text-xs md:text-sm text-gray-600 mt-1">for 3 months</p>
                        </div>
                    </div>
                </div>

                <div className="z-10 flex flex-col gap-3 md:gap-4 bg-primary px-3 py-3 md:px-8 md:py-6 rounded-2xl shadow-sm">

                    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-4">
                        {/* Account Setup Section */}
                        {currentStep === 1 && (
                            <div className="flex flex-col gap-3 md:gap-4">
                                <h3 className="text-sm md:text-base lg:text-lg font-semibold text-gray-900">Account Setup</h3>
                            
                            {/* Your Info */}
                            <div className="flex flex-col gap-2 md:gap-3">
                                <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-900">Your Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="First Name"
                                        type="text"
                                        name="firstName"
                                        placeholder="Enter your first name"
                                        value={formData.firstName}
                                        onChange={(value) => handleInputChange(value, "firstName")}
                                        size="md"
                                    />
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="Last Name"
                                        type="text"
                                        name="lastName"
                                        placeholder="Enter your last name"
                                        value={formData.lastName}
                                        onChange={(value) => handleInputChange(value, "lastName")}
                                        size="md"
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            isRequired
                                            hideRequiredIndicator
                                            label="Email Address"
                                            type="email"
                                            name="email"
                                            placeholder="Enter your email"
                                            value={formData.email}
                                            onChange={(value) => handleInputChange(value, "email")}
                                            size="md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Business Info */}
                            <div className="flex flex-col gap-2 md:gap-3">
                                <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-900">Business Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                    <div className="md:col-span-2">
                                        <Input
                                            isRequired
                                            hideRequiredIndicator
                                            label="Dealership Name"
                                            type="text"
                                            name="dealershipName"
                                            placeholder="Enter dealership name"
                                            value={formData.dealershipName}
                                            onChange={(value) => handleInputChange(value, "dealershipName")}
                                            size="md"
                                        />
                                    </div>
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="Phone"
                                        type="tel"
                                        name="phone"
                                        placeholder="Enter phone number"
                                        value={formData.phone}
                                        onChange={(value) => handleInputChange(value, "phone")}
                                        size="md"
                                    />
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="Website"
                                        type="url"
                                        name="website"
                                        placeholder="Enter dealership website"
                                        value={formData.website}
                                        onChange={(value) => handleInputChange(value, "website")}
                                        size="md"
                                    />
                                    <div className="md:col-span-2">
                                        <Input
                                            isRequired
                                            hideRequiredIndicator
                                            label="Business Address"
                                            type="text"
                                            name="businessAddress"
                                            placeholder="Enter business address"
                                            value={formData.businessAddress}
                                            onChange={(value) => handleInputChange(value, "businessAddress")}
                                            size="md"
                                        />
                                    </div>
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="City"
                                        type="text"
                                        name="city"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={(value) => handleInputChange(value, "city")}
                                        size="md"
                                    />
                                    <Select
                                        label="State*"
                                        placeholder="Select state"
                                        selectedKey={formData.state}
                                        onSelectionChange={(value) => handleInputChange(String(value || ""), "state")}
                                        isRequired
                                        size="md"
                                    >
                                        <Select.Item id="AL">Alabama</Select.Item>
                                        <Select.Item id="AK">Alaska</Select.Item>
                                        <Select.Item id="AZ">Arizona</Select.Item>
                                        <Select.Item id="AR">Arkansas</Select.Item>
                                        <Select.Item id="CA">California</Select.Item>
                                        <Select.Item id="CO">Colorado</Select.Item>
                                        <Select.Item id="CT">Connecticut</Select.Item>
                                        <Select.Item id="DE">Delaware</Select.Item>
                                        <Select.Item id="FL">Florida</Select.Item>
                                        <Select.Item id="GA">Georgia</Select.Item>
                                        <Select.Item id="HI">Hawaii</Select.Item>
                                        <Select.Item id="ID">Idaho</Select.Item>
                                        <Select.Item id="IL">Illinois</Select.Item>
                                        <Select.Item id="IN">Indiana</Select.Item>
                                        <Select.Item id="IA">Iowa</Select.Item>
                                        <Select.Item id="KS">Kansas</Select.Item>
                                        <Select.Item id="KY">Kentucky</Select.Item>
                                        <Select.Item id="LA">Louisiana</Select.Item>
                                        <Select.Item id="ME">Maine</Select.Item>
                                        <Select.Item id="MD">Maryland</Select.Item>
                                        <Select.Item id="MA">Massachusetts</Select.Item>
                                        <Select.Item id="MI">Michigan</Select.Item>
                                        <Select.Item id="MN">Minnesota</Select.Item>
                                        <Select.Item id="MS">Mississippi</Select.Item>
                                        <Select.Item id="MO">Missouri</Select.Item>
                                        <Select.Item id="MT">Montana</Select.Item>
                                        <Select.Item id="NE">Nebraska</Select.Item>
                                        <Select.Item id="NV">Nevada</Select.Item>
                                        <Select.Item id="NH">New Hampshire</Select.Item>
                                        <Select.Item id="NJ">New Jersey</Select.Item>
                                        <Select.Item id="NM">New Mexico</Select.Item>
                                        <Select.Item id="NY">New York</Select.Item>
                                        <Select.Item id="NC">North Carolina</Select.Item>
                                        <Select.Item id="ND">North Dakota</Select.Item>
                                        <Select.Item id="OH">Ohio</Select.Item>
                                        <Select.Item id="OK">Oklahoma</Select.Item>
                                        <Select.Item id="OR">Oregon</Select.Item>
                                        <Select.Item id="PA">Pennsylvania</Select.Item>
                                        <Select.Item id="RI">Rhode Island</Select.Item>
                                        <Select.Item id="SC">South Carolina</Select.Item>
                                        <Select.Item id="SD">South Dakota</Select.Item>
                                        <Select.Item id="TN">Tennessee</Select.Item>
                                        <Select.Item id="TX">Texas</Select.Item>
                                        <Select.Item id="UT">Utah</Select.Item>
                                        <Select.Item id="VT">Vermont</Select.Item>
                                        <Select.Item id="VA">Virginia</Select.Item>
                                        <Select.Item id="WA">Washington</Select.Item>
                                        <Select.Item id="WV">West Virginia</Select.Item>
                                        <Select.Item id="WI">Wisconsin</Select.Item>
                                        <Select.Item id="WY">Wyoming</Select.Item>
                                    </Select>
                                    <Input
                                        isRequired
                                        hideRequiredIndicator
                                        label="Zip Code"
                                        type="text"
                                        name="zip"
                                        placeholder="Enter zip code"
                                        value={formData.zip}
                                        onChange={(value) => handleInputChange(value, "zip")}
                                        size="md"
                                    />
                                </div>
                            </div>


                                {/* Continue Button */}
                                <div className="flex flex-col gap-2 md:gap-3 pt-2 md:pt-0">
                                    <Button 
                                        type="button" 
                                        size="md" 
                                        className={`md:size-lg w-full ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={handleNextStep}
                                        disabled={!isFormValid}
                                    >
                                        Continue to Payment
                                    </Button>
                                    {!isFormValid && (
                                        <p className="text-xs text-gray-600 text-center">
                                            Please fill out all required fields correctly to continue
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Account Summary */}
                        {currentStep > 1 && currentStep < 3 && (
                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-600">Account Setup</h4>
                                        <button 
                                            onClick={() => setCurrentStep(1)}
                                            className="text-blue-600 text-xs md:text-sm hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 space-y-2">
                                        <div className="text-xs md:text-sm">
                                            <strong>{formData.firstName} {formData.lastName}</strong><br />
                                            {formData.email}<br />
                                            {formData.dealershipName}<br />
                                            {formData.phone}<br />
                                            {formData.website}<br />
                                            {formData.businessAddress}, {formData.city}, {formData.state} {formData.zip}
                                        </div>
                                    </div>
                                </div>
                        )}

                        {/* Payment Section */}
                        {currentStep === 2 && (
                            <div className="space-y-3 md:space-y-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-600">Payment Information</h4>
                                </div>
                                
                                {/* Billing Address */}
                                <div className="flex flex-col gap-2 md:gap-3">
                                    <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-900">Billing Address</h4>
                                    <div className="space-y-3">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="billingSame"
                                                checked={formData.billingSame}
                                                onChange={() => setFormData(prev => ({ ...prev, billingSame: true }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-gray-700 text-xs md:text-sm">Same as dealership address</span>
                                            {formData.billingSame && (
                                                <svg className="w-4 h-4 text-green-500 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="billingSame"
                                                checked={!formData.billingSame}
                                                onChange={() => setFormData(prev => ({ ...prev, billingSame: false }))}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-gray-700 text-xs md:text-sm">Use a different billing address</span>
                                        </label>
                                    </div>
                                    
                                    {/* Different Billing Address Fields */}
                                    {!formData.billingSame && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                                            <div className="md:col-span-2">
                                                <Input
                                                    isRequired
                                                    hideRequiredIndicator
                                                    label="Billing Address"
                                                    type="text"
                                                    name="billingAddress"
                                                    placeholder="Enter billing address"
                                                    value={formData.billingAddress}
                                                    onChange={(value) => handleInputChange(value, "billingAddress")}
                                                    size="md"
                                                />
                                            </div>
                                            <Input
                                                isRequired
                                                hideRequiredIndicator
                                                label="Billing City"
                                                type="text"
                                                name="billingCity"
                                                placeholder="Enter billing city"
                                                value={formData.billingCity}
                                                onChange={(value) => handleInputChange(value, "billingCity")}
                                                size="md"
                                            />
                                            <Select
                                                label="Billing State*"
                                                placeholder="Select state"
                                                selectedKey={formData.billingState}
                                                onSelectionChange={(value) => handleInputChange(String(value || ""), "billingState")}
                                                isRequired
                                                size="md"
                                            >
                                                <Select.Item id="AL">Alabama</Select.Item>
                                                <Select.Item id="AK">Alaska</Select.Item>
                                                <Select.Item id="AZ">Arizona</Select.Item>
                                                <Select.Item id="AR">Arkansas</Select.Item>
                                                <Select.Item id="CA">California</Select.Item>
                                                <Select.Item id="CO">Colorado</Select.Item>
                                                <Select.Item id="CT">Connecticut</Select.Item>
                                                <Select.Item id="DE">Delaware</Select.Item>
                                                <Select.Item id="FL">Florida</Select.Item>
                                                <Select.Item id="GA">Georgia</Select.Item>
                                                <Select.Item id="HI">Hawaii</Select.Item>
                                                <Select.Item id="ID">Idaho</Select.Item>
                                                <Select.Item id="IL">Illinois</Select.Item>
                                                <Select.Item id="IN">Indiana</Select.Item>
                                                <Select.Item id="IA">Iowa</Select.Item>
                                                <Select.Item id="KS">Kansas</Select.Item>
                                                <Select.Item id="KY">Kentucky</Select.Item>
                                                <Select.Item id="LA">Louisiana</Select.Item>
                                                <Select.Item id="ME">Maine</Select.Item>
                                                <Select.Item id="MD">Maryland</Select.Item>
                                                <Select.Item id="MA">Massachusetts</Select.Item>
                                                <Select.Item id="MI">Michigan</Select.Item>
                                                <Select.Item id="MN">Minnesota</Select.Item>
                                                <Select.Item id="MS">Mississippi</Select.Item>
                                                <Select.Item id="MO">Missouri</Select.Item>
                                                <Select.Item id="MT">Montana</Select.Item>
                                                <Select.Item id="NE">Nebraska</Select.Item>
                                                <Select.Item id="NV">Nevada</Select.Item>
                                                <Select.Item id="NH">New Hampshire</Select.Item>
                                                <Select.Item id="NJ">New Jersey</Select.Item>
                                                <Select.Item id="NM">New Mexico</Select.Item>
                                                <Select.Item id="NY">New York</Select.Item>
                                                <Select.Item id="NC">North Carolina</Select.Item>
                                                <Select.Item id="ND">North Dakota</Select.Item>
                                                <Select.Item id="OH">Ohio</Select.Item>
                                                <Select.Item id="OK">Oklahoma</Select.Item>
                                                <Select.Item id="OR">Oregon</Select.Item>
                                                <Select.Item id="PA">Pennsylvania</Select.Item>
                                                <Select.Item id="RI">Rhode Island</Select.Item>
                                                <Select.Item id="SC">South Carolina</Select.Item>
                                                <Select.Item id="SD">South Dakota</Select.Item>
                                                <Select.Item id="TN">Tennessee</Select.Item>
                                                <Select.Item id="TX">Texas</Select.Item>
                                                <Select.Item id="UT">Utah</Select.Item>
                                                <Select.Item id="VT">Vermont</Select.Item>
                                                <Select.Item id="VA">Virginia</Select.Item>
                                                <Select.Item id="WA">Washington</Select.Item>
                                                <Select.Item id="WV">West Virginia</Select.Item>
                                                <Select.Item id="WI">Wisconsin</Select.Item>
                                                <Select.Item id="WY">Wyoming</Select.Item>
                                            </Select>
                                            <Input
                                                isRequired
                                                hideRequiredIndicator
                                                label="Billing Zip Code"
                                                type="text"
                                                name="billingZip"
                                                placeholder="Enter billing zip code"
                                                value={formData.billingZip}
                                                onChange={(value) => handleInputChange(value, "billingZip")}
                                                size="md"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {stripeLoaded ? (
                                    <PaymentForm 
                                        formData={formData}
                                        onSuccess={() => setCurrentStep(3)}
                                        onBack={() => setCurrentStep(1)}
                                    />
                                ) : (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="text-sm text-red-800">
                                            <strong>Payment system loading...</strong><br />
                                            Please wait while we load the payment system. If this persists, please refresh the page.
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Confirmation Section */}
                        {currentStep === 3 && (
                            <div className="space-y-3 md:space-y-4">
                                {/* Read-only Account Summary */}
                                <div className="space-y-3 md:space-y-4">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-600">Account Setup</h4>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4 space-y-2">
                                        <div className="text-xs md:text-sm">
                                            <strong>{formData.firstName} {formData.lastName}</strong><br />
                                            {formData.email}<br />
                                            {formData.dealershipName}<br />
                                            {formData.phone}<br />
                                            {formData.website}<br />
                                            {formData.businessAddress}, {formData.city}, {formData.state} {formData.zip}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <h4 className="text-xs md:text-sm lg:text-md font-medium text-gray-600">Order Confirmation</h4>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
                                    <div className="text-xs md:text-sm text-green-800">
                                        <strong>Payment Successful!</strong><br />
                                        Your subscription has been activated. We've sent a verification email to complete your account setup.
                                    </div>
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                                    <div className="text-xs md:text-sm text-gray-700">
                                        <strong>Verification Email Sent To:</strong><br />
                                        {editingEmail ? (
                                            <div className="mt-2">
                                                <Input
                                                    type="email"
                                                    name="email"
                                                    placeholder="Enter email address"
                                                    value={formData.email}
                                                    onChange={(value) => handleInputChange(value, "email")}
                                                    size="md"
                                                    className="mb-2"
                                                />
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={() => setEditingEmail(false)}
                                                        className="bg-green-600 text-white hover:bg-green-700"
                                                        size="sm"
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => setEditingEmail(false)}
                                                        className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                                                        size="sm"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 mt-2">
                                                <span>{formData.email}</span>
                                                <button 
                                                    onClick={() => setEditingEmail(true)}
                                                    className="text-blue-600 text-xs md:text-sm hover:underline"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                                    <div className="text-xs md:text-sm text-blue-800">
                                        <strong>Next Steps:</strong><br />
                                        1. Check your email inbox (and spam folder)<br />
                                        2. Click the verification link in the email<br />
                                        3. Set your password and log in
                                    </div>
                                    <Button 
                                        type="button" 
                                        onClick={async () => {
                                            try {
                                                // Send verification email
                                                const response = await fetch('/api/send-verification-email', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ 
                                                        email: formData.email
                                                    })
                                                });
                                                
                                                if (response.ok) {
                                                    alert('Verification email sent successfully!');
                                                } else {
                                                    alert('Failed to send verification email. Please try again.');
                                                }
                                            } catch (error) {
                                                alert('Error sending verification email. Please try again.');
                                            }
                                        }}
                                        className="mt-2 bg-blue-600 text-white hover:bg-blue-700 w-full"
                                    >
                                        Resend Verification Email
                                    </Button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </section>
        </Elements>
    );
}
