'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { UntitledLogo } from '@/components/foundations/logo/untitledui-logo-2nd';
import { BackgroundPattern } from '@/components/shared-assets/background-patterns';

function OrderConfirmationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1); // 1: confirmation, 2: email sent
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get email from URL params if available
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const sendVerificationEmail = async (emailAddress: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/send-verification-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailAddress }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep(2); // Move to email sent step
      } else {
        setError(data.error || 'Failed to send verification email');
      }
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    sendVerificationEmail(email);
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          Payment Successful!
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          Thank you for subscribing to Unique Leverage! Your payment has been processed successfully.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Subscription:</span>
            <span className="text-sm text-gray-900">The Basic</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Amount:</span>
            <span className="text-sm text-gray-900">$99.00</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Billing:</span>
            <span className="text-sm text-gray-900">Monthly</span>
          </div>
        </div>
      </div>
      
      <div className="z-10 flex flex-col gap-4 w-full max-w-sm">
        <Input
          isRequired
          hideRequiredIndicator
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(value) => setEmail(value)}
          size="md"
        />
        
        {error && (
          <div className="text-sm text-red-600 text-center">
            {error}
          </div>
        )}
        
        <Button
          onClick={handleContinue}
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Sending Email...' : 'Continue to Account Setup'}
        </Button>
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
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-display-xs font-semibold text-primary md:text-display-sm">
          Check Your Email
        </h1>
        
        <p className="text-md text-tertiary max-w-md">
          We've sent a verification email to <strong>{email}</strong>. Please check your inbox and click the verification button to complete your account setup.
        </p>
        
        <div className="bg-yellow-50 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> The verification link will expire in 1 hour.
          </p>
        </div>
      </div>
      
      <div className="z-10 flex flex-col gap-4 w-full max-w-sm">
        <Button
          onClick={() => sendVerificationEmail(email)}
          size="md"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Resending...' : 'Resend Email'}
        </Button>
        
        {error && (
          <div className="text-sm text-red-600 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );


  return (
    <section className="min-h-screen overflow-hidden bg-secondary px-4 py-12 md:px-8 md:pt-24">
      <div className="mx-auto flex w-full flex-col gap-8 sm:max-w-110">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </section>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
