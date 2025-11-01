'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { UntitledLogo } from '@/components/foundations/logo/untitledui-logo-2nd';
import { BackgroundPattern } from '@/components/shared-assets/background-patterns';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1: verifying, 2: success, 3: password setup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    const mode = searchParams.get('mode');
    const emailParam = searchParams.get('email');
    
    if (mode === 'reset' && emailParam && token) {
      // Password reset mode
      setIsPasswordReset(true);
      setEmail(emailParam);
      setStep(3); // Go directly to password setup
    } else if (token) {
      // Email verification mode
      verifyToken(token);
    } else {
      setError('Invalid verification link');
      setStep(4); // Error state
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmail(data.email);
        setStep(2); // Success state
      } else {
        setError(data.error || 'Invalid or expired verification link');
        setStep(4); // Error state
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
      setStep(4); // Error state
    }
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Set password for existing user (after email verification or password reset)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add reset token header if this is a password reset
      if (isPasswordReset) {
        const token = searchParams.get('token');
        if (token) {
          headers['x-reset-token'] = token;
        }
      }
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'set-password',
          email: email,
          password: password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to set password');
        return;
      }

      // Store login success in localStorage for session management
      localStorage.setItem('userEmail', email);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Redirect based on mode
      if (isPasswordReset) {
        // For password reset, redirect to login with success message
        router.push('/login?message=password-reset-success');
      } else {
        // For email verification, redirect to introduction page
        router.push('/docs/introduction');
      }
    } catch (err) {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
        <UntitledLogo className="relative z-10 h-12 max-md:hidden" />
        <UntitledLogo className="relative z-10 h-10 md:hidden" />
      </div>
      
      <div className="z-10 flex flex-col gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          Verifying Email...
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          Please wait while we verify your email address.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
        <UntitledLogo className="relative z-10 h-12 max-md:hidden" />
        <UntitledLogo className="relative z-10 h-10 md:hidden" />
      </div>
      
      <div className="z-10 flex flex-col gap-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          Email Verified!
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          Your email has been successfully verified. Now let's set up your account password.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>
      
      <div className="z-10 flex flex-col gap-4 w-full max-w-sm">
        <Button
          onClick={() => setStep(3)}
          size="lg"
          className="w-full"
        >
          Set Up Password
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
        <UntitledLogo className="relative z-10 h-12 max-md:hidden" />
        <UntitledLogo className="relative z-10 h-10 md:hidden" />
      </div>
      
      <div className="z-10 flex flex-col gap-4">
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          {isPasswordReset ? 'Reset Your Password' : 'Set Up Your Account'}
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          {isPasswordReset 
            ? 'Create a new password to secure your account.' 
            : 'Create a password to secure your account and access your dashboard.'}
        </p>
        
        <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>
      
      <form onSubmit={handlePasswordSetup} className="z-10 flex flex-col gap-4 w-full max-w-sm">
        <Input
          isRequired
          hideRequiredIndicator
          label="Password"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(value) => setPassword(value)}
          size="md"
        />
        
        <Input
          isRequired
          hideRequiredIndicator
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(value) => setConfirmPassword(value)}
          size="md"
        />
        
        {error && (
          <div className="text-sm text-red-600 text-center">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => setStep(2)}
            size="md"
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            size="md"
            className="flex-1"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Setup'}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="relative">
        <BackgroundPattern pattern="grid" className="absolute top-1/2 left-1/2 z-0 hidden -translate-x-1/2 -translate-y-1/2 md:block" />
        <BackgroundPattern pattern="grid" size="md" className="absolute top-1/2 left-1/2 z-0 -translate-x-1/2 -translate-y-1/2 md:hidden" />
        <UntitledLogo className="relative z-10 h-12 max-md:hidden" />
        <UntitledLogo className="relative z-10 h-10 md:hidden" />
      </div>
      
      <div className="z-10 flex flex-col gap-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          Verification Failed
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          {error}
        </p>
      </div>
      
      <div className="z-10 flex flex-col gap-4 w-full max-w-sm">
        <Button
          onClick={() => router.push('/signup')}
          size="lg"
          className="w-full"
        >
          Back to Signup
        </Button>
      </div>
    </div>
  );

  return (
    <section className="min-h-screen overflow-hidden bg-secondary px-4 py-12 md:px-8 md:pt-24">
      <div className="mx-auto flex w-full flex-col gap-8 sm:max-w-110">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}

