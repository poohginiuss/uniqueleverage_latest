"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { UntitledLogoMinimal } from "@/components/foundations/logo/untitledui-logo-minimal-2nd";
import { BackgroundPattern } from "@/components/shared-assets/background-patterns";
import { useAuth } from "@/contexts/auth-context";

function LoginPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, isLoading, login, user } = useAuth();
    const [loginMode, setLoginMode] = useState<'email' | 'password'>('email');
    const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    useEffect(() => {
        const message = searchParams.get('message');
        if (message === 'password-reset-success') {
            setSuccessMessage('Your password has been successfully reset. You can now log in with your new password.');
        }
    }, [searchParams]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = Object.fromEntries(new FormData(form)) as { email: string };
        
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/send-login-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setEmailSent(true);
                // Reset the form to clear fields
                form.reset();
            } else {
                setError(result.error || 'Failed to send login email');
            }
        } catch (error) {
            console.error('Login email error:', error);
            setError('Failed to send login email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
            remember: formData.get('remember') === 'on' // Checkbox returns 'on' when checked
        };
        
        setLoading(true);
        setError('');
        
        try {
            // Create server-side session
            const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    remember: data.remember
                }),
            });

            const result = await response.json();

            if (response.ok) {
                // Update auth context
                login(result.user);
                
                // Store login success in localStorage for backward compatibility
                localStorage.setItem('userEmail', data.email);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userRole', result.user.role);
                
                // Role-based routing using Next.js router for smoother navigation
                if (result.user.role === 'admin') {
                    // Admin user - redirect to admin dashboard
                    router.push('/admin');
                } else {
                    // Regular customer - redirect to introduction page
                    router.push('/docs/introduction');
                }
            } else {
                setError(result.error || 'Invalid credentials');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        setForgotPasswordMode(true);
        setError('');
        setEmailSent(false);
        setSuccessMessage('');
    };

    const handleBackToLogin = () => {
        setForgotPasswordMode(false);
        setError('');
        setEmailSent(false);
        setSuccessMessage('');
    };

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const data = Object.fromEntries(new FormData(form)) as { email: string };
        
        if (!data.email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: data.email }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setEmailSent(true);
                setError('');
            } else {
                setError(result.error || 'Failed to send password reset email');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('Failed to send password reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <section className="min-h-screen bg-gray-50 px-3 py-6 md:px-8 flex items-start justify-center pt-16 md:pt-24">
            <div className="mx-auto flex w-full flex-col gap-4 md:gap-8 max-w-sm sm:max-w-110 pb-8">
                <div className="flex flex-col items-center gap-3 md:gap-6 text-center">
                    <div className="relative">
                        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                        <a href="/" className="relative z-10 block">
                            <UntitledLogoMinimal className="h-12 w-12 md:h-14 md:w-14 hover:opacity-80 transition-opacity" />
                        </a>
                    </div>
                    <div className="z-10 flex flex-col gap-1">
                        <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                            {forgotPasswordMode 
                                ? (emailSent ? 'Check your email' : 'Forgot your password?')
                                : 'Log in to your account'}
                        </h1>
                        <p className="text-xs md:text-sm text-gray-600">
                            {forgotPasswordMode 
                                ? (emailSent 
                                    ? 'We\'ve sent you a password reset link. Check your inbox and follow the instructions to reset your password.'
                                    : 'Enter your email address and we\'ll send you a password reset link.')
                                : 'Welcome back! Please enter your details.'}
                        </p>
                    </div>
                </div>


                {forgotPasswordMode ? (
                    // Forgot Password Form
                    <div className="z-10 flex flex-col gap-4 md:gap-6 bg-primary px-4 py-6 md:px-8 md:py-8 rounded-2xl shadow-sm">
                        {/* Back button - only show when email hasn't been sent */}
                        {!emailSent && (
                            <div className="flex items-center -mt-2 mb-2 px-2">
                                <button
                                    onClick={handleBackToLogin}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover transition-colors cursor-pointer"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
                                    </svg>
                                    Back
                                </button>
                            </div>
                        )}

                        {/* Messages */}
                        {emailSent && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-green-600 mt-0.5">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                            <p className="text-sm font-medium text-green-800">Password reset email sent!</p>
                                            <p className="text-sm text-green-700 mt-1">
                                                The link will expire in 30 mins.
                                            </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-red-600 mt-0.5">
                                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        {!emailSent && (
                            <Form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                                <Input 
                                    isRequired 
                                    hideRequiredIndicator 
                                    label="Email Address" 
                                    type="email" 
                                    name="email" 
                                    placeholder="Enter your email address" 
                                    size="md"
                                />

                                <Button 
                                    type="submit" 
                                    size="lg" 
                                    className="w-full" 
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Email'}
                                </Button>
                            </Form>
                        )}
                    </div>
                ) : loginMode === 'email' ? (
                    // Login Email Form
                    <Form
                        onSubmit={handleEmailSubmit}
                        className="z-10 flex flex-col gap-4 md:gap-6 bg-primary px-4 py-6 md:px-8 md:py-8 rounded-2xl shadow-sm"
                    >

                        <div className="flex flex-col gap-4 md:gap-6">
                            {emailSent && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-green-600 mt-0.5">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Email sent successfully!</p>
                                            <p className="text-sm text-green-700 mt-1">
                                                An email has been sent to your email address. Please check your inbox and follow the instructions.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-red-600 mt-0.5">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                </div>
                            )}

                            {successMessage && (
                                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="text-green-600 mt-0.5">
                                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-800">Password reset successful!</p>
                                            <p className="text-sm text-green-700 mt-1">{successMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Input 
                                isRequired 
                                hideRequiredIndicator 
                                label="Email or Username" 
                                type="text" 
                                name="email" 
                                placeholder="Enter your email or username" 
                                size="md" 
                            />
                            
                            <div className="flex flex-col gap-3 md:gap-4">
                                <Button type="submit" size="md" className="md:size-lg" disabled={loading || isLoading}>
                                    {loading ? 'Sending...' : isLoading ? 'Checking...' : 'Continue'}
                                </Button>
                            </div>

                            <div className="flex justify-end">
                                <Button 
                                    color="link-color" 
                                    size="sm" 
                                    className="md:size-md p-0 h-auto"
                                    onClick={() => {
                                        setLoginMode('password');
                                        setError('');
                                        setEmailSent(false);
                                    }}
                                >
                                    Sign in with password
                                </Button>
                            </div>

                            <div className="flex justify-center items-center gap-1 text-center">
                                <span className="text-xs md:text-sm text-gray-600">First time here?</span>
                                <a href="/signup">
                                    <Button color="link-color" size="sm" className="md:size-md p-0 h-auto">
                                        Create an account
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </Form>
                ) : (
                    <Form
                        onSubmit={handlePasswordSubmit}
                        className="z-10 flex flex-col gap-4 md:gap-6 bg-primary px-4 py-6 md:px-8 md:py-8 rounded-2xl shadow-sm"
                    >
                        {/* Password form */}
                        <div className="flex flex-col gap-4 md:gap-5">
                            <Input 
                                isRequired 
                                hideRequiredIndicator 
                                label="Email or Username" 
                                type="text" 
                                name="email" 
                                placeholder="Enter your email or username" 
                                size="md"
                                autoComplete="username"
                            />
                            <Input 
                                isRequired 
                                hideRequiredIndicator 
                                label="Password" 
                                type="password" 
                                name="password" 
                                size="md" 
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
                            <Checkbox label="Remember for 30 days" name="remember" />

                            <Button 
                                color="link-color" 
                                size="sm" 
                                className="md:size-md p-0 h-auto md:ml-auto" 
                                onClick={handleForgotPassword}
                                disabled={loading}
                            >
                                Forgot password?
                            </Button>
                        </div>

                        {error && (
                            <div className="text-sm text-red-600 text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 md:gap-4">
                            <Button type="submit" size="md" className="md:size-lg" disabled={loading || isLoading}>
                                {loading ? 'Signing in...' : isLoading ? 'Checking...' : 'Continue'}
                            </Button>
                        </div>

                                    <div className="flex justify-end">
                                        <Button 
                                            color="link-color" 
                                            size="sm" 
                                            className="md:size-md p-0 h-auto"
                                            onClick={() => {
                                                setLoginMode('email');
                                                setError('');
                                                setEmailSent(false);
                                            }}
                                        >
                                            Sign in with email
                                        </Button>
                                    </div>

                                    <div className="flex justify-center items-center gap-1 text-center">
                                        <span className="text-xs md:text-sm text-gray-600">First time here?</span>
                                        <a href="/signup">
                                            <Button color="link-color" size="sm" className="md:size-md p-0 h-auto">
                                                Create an account
                                            </Button>
                                        </a>
                                    </div>
                    </Form>
                )}
            </div>
        </section>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <section className="min-h-screen bg-gray-50 px-3 py-6 md:px-8 flex items-start justify-center pt-16 md:pt-24">
                <div className="mx-auto flex w-full flex-col gap-4 md:gap-8 max-w-sm sm:max-w-110 pb-8">
                    <div className="flex flex-col items-center gap-3 md:gap-6 text-center">
                        <div className="relative">
                            <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
                            <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
                            <a href="/" className="relative z-10 block">
                                <UntitledLogoMinimal className="h-12 w-12 md:h-14 md:w-14 hover:opacity-80 transition-opacity" />
                            </a>
                        </div>
                        <div className="z-10 flex flex-col gap-1">
                            <h1 className="text-lg md:text-xl font-semibold text-gray-900">Loading...</h1>
                            <p className="text-xs md:text-sm text-gray-600">Please wait a moment.</p>
                        </div>
                    </div>
                    <div className="z-10 flex flex-col gap-4 md:gap-6 bg-primary px-4 py-6 md:px-8 md:py-8 rounded-2xl shadow-sm">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                </div>
            </section>
        }>
            <LoginPageContent />
        </Suspense>
    );
}
