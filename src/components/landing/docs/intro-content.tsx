import React, { useState, useEffect, useRef } from "react";
import { FaApple, FaWindows } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useInventoryStatus } from "@/hooks/use-inventory-status";

// Intro/Docs page built with React + TypeScript + Tailwind (drop-in TSX component)
// - No external UI libs required
// - Uses semantic HTML and accessible buttons for the FAQ accordion
// - You can swap the placeholder links/logos with your own

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export const ULIntroPage = ({ showWelcomeSection = false }: { showWelcomeSection?: boolean }) => {
  const router = useRouter();
  // Track user progress from database
  const [userProgress, setUserProgress] = useState({
    step1Completed: false, // Connect Inventory
    step2Completed: false, // Download App
    step3Completed: false  // Manage Integrations
  });

  // Conversation management (for wizard page)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const conversationsLoadedRef = useRef(false);

  // Use optimized inventory status hook (fetches all providers)
  const { 
    status: connectionStatus, 
    loading: statusLoading, 
    shouldShowProcessing, 
    connectedCount,
    refreshStatus,
    invalidateCache
  } = useInventoryStatus();

  // Fetch progress from API on component mount
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/user-progress');
        if (response.ok) {
          const data = await response.json();
          setUserProgress(data);
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      }
    };

    fetchProgress();
  }, []);

  // Load conversations (for wizard page)
  const loadConversations = async () => {
    if (!showWelcomeSection) return;
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/conversation?customerId=1');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        conversationsLoadedRef.current = true;
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversation/${conversationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Save progress to database
  const updateProgress = async (step: keyof typeof userProgress) => {
    try {
      const response = await fetch('/api/user-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step })
      });
      
      if (response.ok) {
        const newProgress = { ...userProgress, [step]: true };
        setUserProgress(newProgress);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  // Load conversations when showing welcome section
  useEffect(() => {
    if (showWelcomeSection && !conversationsLoadedRef.current) {
      loadConversations();
    }
  }, [showWelcomeSection]);

  return (
    <div className="flex items-start px-4 py-16 lg:px-8">
      <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
        {/* Main column */}
        <div className="size-full text-tertiary">
          {/* Intro header - Hidden on wizard page */}
          {!showWelcomeSection && (
          <div className="mb-10">
            <div className="mb-6">
              <div
                className="relative flex shrink-0 items-center justify-center *:data-icon:size-7 bg-primary_alt ring-1 ring-inset before:absolute before:inset-1 before:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_3px_3px_0px_rgba(0,0,0,0.09),1px_8px_5px_0px_rgba(0,0,0,0.05),2px_21px_6px_0px_rgba(0,0,0,0),0px_0px_0px_1px_rgba(0,0,0,0.08),1px_13px_5px_0px_rgba(0,0,0,0.01),0px_-2px_2px_0px_rgba(0,0,0,0.13)_inset] before:ring-1 before:ring-secondary_alt size-14 rounded-[14px] before:rounded-[10px] text-fg-secondary ring-primary dark:ring-secondary dark:before:opacity-0"
                data-featured-icon="true"
              >
                <div className="z-10">
                  {/* Star icon */}
                  {/* <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-6 text-utility-gray-500"
                  >
                    <path d="M4.5 22v-5m0-10V2M2 4.5h5m-5 15h5M13 3l-1.734 4.509c-.282.733-.423 1.1-.643 1.408a3 3 0 0 1-.706.707c-.308.219-.675.36-1.408.642L4 12l4.509 1.734c.733.282 1.1.423 1.408.643.273.194.512.433.707.706.219.308.36.675.642 1.408L13 21l1.734-4.509c.282-.733.423-1.1.643-1.408.194-.273.433-.512.706-.707.308-.219.675-.36 1.408-.642L22 12l-4.509-1.734c-.733-.282-1.1-.423-1.408-.642a3 3 0 0 1-.706-.707c-.22-.308-.36-.675-.643-1.408L13 3Z" />
                  </svg> */}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="max-w-3xl text-2xl font-semibold text-primary">
                Ad-Wizard
              </h1>
            </div>

            <p className="typography mt-3 max-w-3xl text-base whitespace-pre-line">
              Welcome to Unique Leverage! This platform is a collection of tools and integrations built specifically for automotive dealerships and sales professionals.
            </p>
          </div>
          )}

          {/* Ready when you are section - only show if showWelcomeSection is true */}
          {showWelcomeSection && (
          <div className="mt-10 mb-10">
            <div className="text-center mb-8">
              <h2 className="text-[32px] font-normal text-primary leading-[40px] tracking-[-0.01em]">
                Ready when you are.
              </h2>
            </div>
            
            {/* Search bar - positioned below "Ready when you are" on desktop, fixed at bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 z-30 p-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:p-0 w-full max-w-3xl mx-auto mb-8 lg:mb-8">
              <div className="relative">
                <div className="flex items-center bg-white dark:bg-gray-900 rounded-[24px] px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-200">
                  <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Ask anything"
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 text-[16px] leading-[24px] font-normal"
                  />
                  
                  <div className="flex items-center space-x-1">
                    <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
          </div>

            {/* Four Action Cards */}
            <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-3xl mx-auto">
              <button 
                onClick={() => router.push('/gpt/campaigns')}
                className="group p-6 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors duration-200">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 mb-1 h-5">
                      Campaigns
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-1 min-h-[1.25rem]">
                      Manage and customize your Facebook ads
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/gpt/ad-wizard')}
                className="group p-6 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors duration-200">
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-1 h-5">
                      Ad Wizard
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-1 min-h-[1.25rem]">
                      Create targeted Facebook and Instagram ads
                    </div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => router.push('/gpt/contacts')}
                className="group p-6 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors duration-200">
                      <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 h-5">
                      Contacts
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 min-h-[1.25rem]">
                      Review performance metrics and insights
                    </div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push('/gpt/automations')}
                className="group p-6 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-700"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-orange-50 dark:bg-orange-900/20 rounded-lg flex items-center justify-center group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors duration-200">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200 h-5">
                      Automations
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 min-h-[1.25rem]">
                      Manage customer communication
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
          )}

          {/* Divider - Only show on docs page (when showWelcomeSection is false) */}
          {!showWelcomeSection && <Divider />}

          {/* What is - Hidden on wizard page */}
          {!showWelcomeSection && (
          <Section id="what-is-untitled-ui-react" title="What is Unique Leverage?">
            <p>
              A complete platform for dealers and salespeople to post inventory, run ads, schedule test drives, and track results in one place.
            </p>
            <p className="mt-3">
              Skip months of setup with built-in feed integrations, native scheduling pages, AI-powered ad creation, and automated posting to Facebook Marketplace. Unique Leverage includes a tracking pixel for accurate lead attribution.
            </p>
            <p className="mt-3">
              It's the perfect hub once your feed is connected—giving you everything you need to market and sell, with powerful, ready-to-use automotive tools.
            </p>
          </Section>
          )}

          {/* Divider - Only show on docs page */}
          {!showWelcomeSection && <Divider />}

          {/* Getting Started Steps - Hidden on wizard page */}
          {!showWelcomeSection && (
          <Section id="tech-stack" title="Getting Started">
            <p>
              Follow these steps to get up and running with Unique Leverage. Each step builds on the previous one to give you the complete experience.
            </p>
            <div className="grid grid-cols-1 gap-6 mt-8 mb-3">
              {/* Step 1: Connect Inventory */}
              <div className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl p-4 sm:p-5 outline-focus-ring transition duration-200 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 ${
                statusLoading
                  ? 'bg-gray-50 dark:bg-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/40 opacity-75'
                  : connectionStatus.isConnected
                    ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-300 dark:ring-green-600/50 shadow-lg shadow-green-100 dark:shadow-green-900/20'
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 ring-1 ring-blue-200/50 dark:ring-blue-700/40 hover:from-blue-50/60 hover:to-indigo-50/60 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30'
              }`}>
                {/* Step label */}
                <div className={`text-xs font-medium mb-2 sm:absolute sm:top-4 sm:left-5 ${
                  statusLoading
                    ? 'text-gray-500 dark:text-gray-400'
                    : connectionStatus.isConnected 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-blue-600 dark:text-blue-400'
                }`}>
                  Step 1 {statusLoading ? '⏳' : connectionStatus.isConnected ? '✓' : '→'}
                </div>


                <div className="flex flex-col gap-0.5 mt-6 sm:mt-8 sm:flex-1">
                  <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 12 }}>
                    Connect Inventory
                  </p>
                  <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 12 }}>
                    Start by sending an email to your provider.
                  </p>
                  
                  {/* Status Indicator - reserved space prevents layout shift */}
                  <div className="flex items-center gap-2 mt-2 min-h-[20px]">
                    {!statusLoading && (
                      <>
                        {shouldShowProcessing && (
                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        )}
                        {connectionStatus.isConnected && (
                          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-3.5 text-green-600 dark:text-green-400">
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        )}
                        <span className={`text-xs font-medium transition-colors duration-300 ${
                          shouldShowProcessing 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : connectionStatus.isConnected 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {shouldShowProcessing 
                            ? 'Processing...' 
                            : connectionStatus.isConnected 
                            ? connectedCount === 1 
                              ? '1 account connected' 
                              : `${connectedCount} accounts connected`
                            : 'Not connected'
                          }
                        </span>
                      </>
                    )}
                  </div>
            </div>

                <button
                  className={`group relative inline-flex items-center justify-center gap-1 rounded-lg px-3.5 py-2.5 text-sm font-semibold ring-1 ring-inset transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 no-underline cursor-pointer mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto ${
                    statusLoading
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 cursor-not-allowed opacity-60'
                      : connectionStatus.isConnected
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-gray-300 dark:hover:ring-gray-500 hover:shadow-sm focus:ring-gray-400'
                        : 'bg-blue-600 text-white ring-blue-600 hover:bg-blue-700 hover:ring-blue-700 hover:shadow-lg focus:ring-blue-500'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (statusLoading) return;
                    if (connectionStatus.isConnected) {
                      router.push('/docs/request-feeds');
                    } else {
                      updateProgress('step1Completed');
                      router.push('/docs/request-feeds');
                    }
                  }}
                  disabled={statusLoading}
                >
                  <span className="px-0.5">
                    {statusLoading ? 'Loading...' : connectionStatus.isConnected ? 'Manage' : 'Request Feed'}
                  </span>
                </button>
              </div>

              {/* Step 2: Account Setup */}
              <div className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl p-4 sm:p-5 outline-focus-ring transition duration-200 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 ${
                statusLoading
                  ? 'bg-gray-50 dark:bg-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/40 opacity-60'
                  : userProgress.step2Completed 
                    ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-300 dark:ring-green-600/50 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                    : connectionStatus.isConnected
                      ? 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 ring-1 ring-purple-200/50 dark:ring-purple-700/40 hover:from-purple-50/60 hover:to-pink-50/60 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30'
                      : 'bg-gray-50 dark:bg-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/40 opacity-60'
              }`}>
                {/* Step label */}
                <div className={`text-xs font-medium mb-2 sm:absolute sm:top-4 sm:left-5 ${
                  statusLoading
                    ? 'text-gray-500 dark:text-gray-400'
                    : userProgress.step2Completed 
                      ? 'text-green-600 dark:text-green-400' 
                      : connectionStatus.isConnected 
                        ? 'text-purple-600 dark:text-purple-400' 
                        : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Step 2 {statusLoading ? '⏳' : userProgress.step2Completed ? '✓' : connectionStatus.isConnected ? '→' : '⏳'}
                </div>

                <div className="flex flex-col gap-0.5 mt-6 sm:mt-8 sm:flex-1">
    <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 12 }}>
                    Account Setup
    </p>
    <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 12 }}>
                    Manage your connected integrations
    </p>
  </div>

  <button
                    className={`group relative inline-flex items-center justify-center gap-1 rounded-lg px-3.5 py-2.5 text-sm font-semibold ring-1 ring-inset transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 no-underline cursor-pointer mt-4 sm:mt-0 sm:ml-4 w-full sm:w-auto ${
                      statusLoading
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 cursor-not-allowed opacity-60'
                        : connectionStatus.isConnected && !userProgress.step2Completed
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-gray-300 dark:hover:ring-gray-500 hover:shadow-sm focus:ring-gray-400'
                          : userProgress.step2Completed
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-green-200 dark:ring-green-600'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 cursor-not-allowed opacity-60'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (statusLoading || !connectionStatus.isConnected) return;
                      console.log('Manage Integrations button clicked!');
                      updateProgress('step2Completed');
                      router.push('/docs/integrations');
                    }}
                    disabled={statusLoading || !connectionStatus.isConnected}
                  >
                    <span className="px-0.5">
                      {statusLoading ? 'Loading...' : connectionStatus.isConnected ? (userProgress.step2Completed ? 'Completed' : 'Manage') : 'Get Started'}
                    </span>
                  </button>
              </div>

              {/* Step 3: Download Marketplace Tool */}
              <div className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl p-4 sm:p-5 outline-focus-ring transition duration-200 ease-linear ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 ${
                statusLoading
                  ? 'bg-gray-50 dark:bg-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/40 opacity-60'
                  : userProgress.step3Completed 
                    ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-300 dark:ring-green-600/50 shadow-lg shadow-green-100 dark:shadow-green-900/20' 
                    : connectionStatus.isConnected
                      ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200/50 dark:ring-blue-700/40 hover:bg-blue-50/60 dark:hover:bg-blue-900/30'
                      : 'bg-gray-50 dark:bg-gray-800/20 ring-1 ring-gray-200/50 dark:ring-gray-700/40 opacity-60'
              }`}>
                {/* Step label */}
                <div className={`text-xs font-medium mb-2 sm:absolute sm:top-4 sm:left-5 ${
                  statusLoading
                    ? 'text-gray-500 dark:text-gray-400'
                    : userProgress.step3Completed 
                      ? 'text-green-600 dark:text-green-400' 
                      : connectionStatus.isConnected 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Step 3 {statusLoading ? '⏳' : userProgress.step3Completed ? '✓' : connectionStatus.isConnected ? '→' : '🔒'}
                </div>

                <div className="flex flex-col gap-0.5 mt-6 sm:mt-8 sm:flex-1">
                  <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 12 }}>
                    Download Marketplace Tool
                  </p>
                  <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 12 }}>
                    This feature is only available on Desktop.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0 sm:ml-4">
                  <button
                    className={`group relative inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 no-underline w-full sm:w-auto ${
                      connectionStatus.isConnected && !userProgress.step3Completed
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-gray-300 dark:hover:ring-gray-500 hover:shadow-sm focus:ring-gray-400 cursor-pointer'
                        : userProgress.step3Completed
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-green-200 dark:ring-green-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 opacity-50 cursor-not-allowed'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!connectionStatus.isConnected) return;
                      console.log('Windows download button clicked!');
                      updateProgress('step3Completed');
                      // Add your download logic here
                    }}
                    disabled={!connectionStatus.isConnected}
                  >
                    <FaWindows className="w-3 h-3" />
                    <span className="px-0.5">Windows</span>
                  </button>
                  <button
                    className={`group relative inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ring-1 ring-inset transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 no-underline w-full sm:w-auto ${
                      connectionStatus.isConnected && !userProgress.step3Completed
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 hover:ring-gray-300 dark:hover:ring-gray-500 hover:shadow-sm focus:ring-gray-400 cursor-pointer'
                        : userProgress.step3Completed
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 ring-green-200 dark:ring-green-600'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 ring-gray-200 dark:ring-gray-600 opacity-50 cursor-not-allowed'
                    }`}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
                      if (!connectionStatus.isConnected) return;
                      console.log('Mac download button clicked!');
                      updateProgress('step3Completed');
                      // Add your download logic here
                    }}
                    disabled={!connectionStatus.isConnected}
                  >
                    <FaApple className="w-3 h-3" />
                    <span className="px-0.5">Mac</span>
  </button>
</div>
              </div>
            </div>
          </Section>
          )}

          {/* Divider - Only show on docs page */}
          {!showWelcomeSection && <Divider />}

          {/* Accessibility - Hidden on wizard page */}
          {!showWelcomeSection && (
          <Section id="accessibility" title="Accessibility">
            <p>Accessibility isn't optional — it's essential.</p>
            <p className="mt-3">
              We centralize your Pages, Ad Accounts, Pixels, Audiences, and every ad you've created so you can launch, manage, and track campaigns instantly — without bouncing between tools.
            </p>
          </Section>
          )}

          {/* Divider - Only show on docs page */}
          {!showWelcomeSection && <Divider />}

          {/* How is this different - Hidden on wizard page */}
          {!showWelcomeSection && (
          <Section id="how-is-this-different-from-a-library" title="How is this different from other tools?">
            <p>Most platforms just post inventory or run basic ads. Unique Leverage connects your inventory, ads, scheduling, and follow-up in one system.</p>
            <p className="mt-3">
              Each ad drives customers to a booking page for that vehicle, synced with your calendar. With native pixel tracking and automation, you can launch campaigns, manage leads, and fill your schedule — without juggling tools.
            </p>
          </Section>
          )}

          {/* Divider - Hidden on wizard page */}
          {!showWelcomeSection && <Divider />}

          {/* FAQs - Hidden on wizard page */}
          {!showWelcomeSection && (
          <div className="not-typography mx-auto w-full max-w-[72rem]">
            <h2 className="text-xl font-semibold text-primary">FAQs</h2>
            <p className="mt-3 text-base text-tertiary">
              Please refer to our frequently asked questions page for more.
            </p>

            <div className="mt-8 flex flex-col">
              {faqs.map((f, i) => (
                <FaqItem key={i} question={f.q} answer={f.a} />
              ))}
            </div>
          </div>
          )}

          {/* CTA - Hidden on wizard page */}
          {!showWelcomeSection && (
          <div className="flex w-full items-center mt-24">
            <button
              className="group relative inline-flex items-center gap-1 rounded-lg px-3.5 py-2.5 text-sm font-semibold bg-primary text-secondary ring-1 ring-inset ring-primary hover:bg-primary/90 ml-auto cursor-pointer"
              onClick={() => router.push('/docs/request-feeds')}
            >
              <span className="px-0.5">Request Feed</span>
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="size-5"
              >
                <path d="M5 12h14m0 0-7-7m7 7-7 7"></path>
              </svg>
            </button>
          </div>
          )}
        </div>

        
      </main>
      {/* Right rail: Recent/Chats (wizard) or On this page (docs) */}
      <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
        <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
          {showWelcomeSection ? (
            // Recent/Chats sidebar for wizard page
            <div className="space-y-4">
              <div className="mb-2">
                <p className="text-xs font-medium text-fg-quaternary">
                  {isLoadingConversations ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full"></span>
                      Loading...
                    </span>
                  ) : (
                    `Recent (${conversations.length})`
                  )}
                </p>
              </div>
              
              <button
                onClick={() => {
                  router.push('/gpt/chat');
                }}
                className="text-sm font-semibold text-quaternary hover:text-brand-secondary text-left"
              >
                + New Chat
              </button>
              
              {conversations.map((conversation) => (
                <div key={conversation.id} className="text-sm text-left w-full text-start p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  <button
                    onClick={() => {
                      router.push(`/gpt/chat?conversation=${conversation.id}`);
                    }}
                    className="w-full text-left truncate"
                  >
                    {conversation.title}
                  </button>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(conversation.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </div>
                  
                  {deleteConfirmId === conversation.id && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-700 dark:text-red-300 mb-2">
                        Delete this conversation?
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => deleteConversation(conversation.id)}
                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // TOC sidebar for docs page
            <>
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-fg-quaternary">
              <path d="M3 12h18M3 6h18M3 18h12"></path>
            </svg>
            <p className="text-xs font-semibold text-primary">On this page</p>
          </div>

          <nav className="mt-4">
            <ol className="flex flex-col gap-2 border-l border-secondary pl-3">
              {[
                { id: "what-is-untitled-ui-react", label: "What is Unique Leverage?" },
                { id: "tech-stack", label: "Getting Started" },
                { id: "accessibility", label: "Accessibility" },
                { id: "how-is-this-different-from-a-library", label: "How is this different from a library?" },
              ].map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-sm font-semibold text-quaternary hover:text-brand-secondary">
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Divider() {
  return (
    <hr className="my-12 border-t-2 border-border-secondary" />
  );
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

function TechCard({ href, title, version, details }: { href: string; title: string; version: string; details?: string }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition duration-100 ease-linear ring-inset hover:bg-primary_hover no-underline"
      href={href}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute top-4 right-4 size-4 text-fg-quaternary">
        <path d="M7 17 17 7m0 0H7m10 0v10"></path>
      </svg>
      <div className="flex flex-col">
        <p className="text-sm text-tertiary mt-0" style={{ marginTop: 0, marginBottom: 12 }}>{details}</p>
        <p className="text-sm font-semibold text-primary" style={{ marginTop: 0, marginBottom: 0 }}>{title}</p>
        <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 0 }}>{version}</p>
      </div>
    </a>
  );
}

function ActionCard({ href, title, subtitle, icon }: { href: string; title: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col items-start rounded-xl bg-primary_alt p-5 ring-1 ring-secondary outline-focus-ring transition-all duration-200 ease-linear ring-inset hover:shadow-lg hover:border-blue-500 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 no-underline"
      href={href}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="absolute top-4 right-4 size-4 text-fg-quaternary">
        <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" />
        <polyline points="8 17 12 21 16 17" />
        <line x1="12" y1="12" x2="12" y2="21" />
      </svg>
      {icon}
      <div className="mt-0 flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-primary" style={{ marginTop: 12, marginBottom: 0 }}>{title}</p>
        <p className="text-sm text-tertiary" style={{ marginTop: 0, marginBottom: 0 }}>{subtitle}</p>
      </div>
    </a>
  );
}

function FaqItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = question.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="-mt-px border-t border-secondary last:border-b">
      <h3 className="py-4">
        <button
          aria-expanded={open}
          aria-controls={`faq-${id}`}
          className="flex w-full items-start justify-between gap-2 rounded-md text-left select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-base font-semibold text-primary">{question}</span>
          <span aria-hidden className="flex size-6 items-center text-fg-quaternary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line className={`origin-center transition ${open ? "rotate-90" : "rotate-0"}`} x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>
      </h3>
      <div
        id={`faq-${id}`}
        role="region"
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden pb-4 pr-2 md:pr-6 text-base text-tertiary">
          {typeof answer === "string" ? <p className="mt-1">{answer}</p> : answer}
        </div>
      </div>
    </div>
  );
}

const techCards = [
  {
    href: "",
    details: "Auto-post, update, and remove vehicles on Facebook Marketplace.",
    title: "Marketplace Automation",
    version: "v2.3.4",
  },
  {
    href: "",
    details: "Turn inventory into bookable pages that sync with your calendar.",
    title: "VSP Scheduler",
    version: "v.1.3.4",
  },
  {
    href: "",
    details: "Generate winning ad copy and creatives in seconds.",
    title: "AI Ad Creator Library",
    version: "v2.0",
  },
  {
    href: "",
    details: "Trigger follow-ups, reminders, and actions on autopilot.",
    title: "Automation Workflows",
    version: "v1.9",
  },
] as const;

const faqs = [
  {
    q: "What is Unique Leverage?",
    a: (
      <>
        <p>
          Unique Leverage is an automotive marketing platform that connects your vehicle inventory to Facebook and Instagram with automated content generation. We help dealerships create powerful carousel and single-image ads that drive customers directly to vehicle-specific scheduling pages.
        </p>
        <p className="mt-3">
          Our platform includes an Ad Wizard for creating targeted campaigns, Vehicle Scheduling Pages (VSPs) for seamless test drive bookings, and native pixel tracking for complete campaign analytics.
        </p>
      </>
    ),
  },
  {
    q: "How does the Ad Wizard work?",
    a: (
      <>
        <p>
          The Ad Wizard lets you create targeted campaigns in two ways:
        </p>
        <ul className="list-disc pl-5 mt-3">
          <li><strong>Single Vehicle:</strong> Promote individual vehicles with custom ads</li>
          <li><strong>Vehicle Sets:</strong> Create campaigns for groups of vehicles (Sedans, Trucks, SUVs, or custom sets)</li>
        </ul>
        <p className="mt-3">
          Simply search your inventory, select vehicles, and the wizard generates Facebook-ready ads with vehicle images, pricing, and direct links to scheduling pages.
        </p>
      </>
    ),
  },
  {
    q: "What are Vehicle Scheduling Pages (VSPs)?",
    a: (
      <>
        <p>
          VSPs are dedicated landing pages for each vehicle in your inventory. When customers click on your ads, they're taken directly to a VSP where they can:
        </p>
        <ul className="list-disc pl-5 mt-3">
          <li>View detailed vehicle information and photos</li>
          <li>Schedule test drives through integrated Calendly</li>
          <li>Contact your dealership directly</li>
          <li>Access financing information</li>
        </ul>
        <p className="mt-3">
          Each VSP is automatically generated from your inventory feed and stays updated in real-time.
        </p>
      </>
    ),
  },
  {
    q: "Which inventory systems do you support?",
    a: (
      <>
        <p>
          We support all major automotive inventory management systems including:
        </p>
        <ul className="list-disc pl-5 mt-3">
          <li>DealerCenter</li>
          <li>CarsforSale</li>
          <li>AutoManager</li>
          <li>DealerCarSearch</li>
          <li>DealerON</li>
          <li>vAuto</li>
        </ul>
        <p className="mt-3">
          <a href="/docs/integrations" className="text-primary underline">View our complete list of supported partners</a> for step-by-step connection guides.
        </p>
      </>
    ),
  },
  {
    q: "How much does Unique Leverage cost?",
    a: (
      <>
        <p>
          We offer flexible pricing plans to fit dealerships of all sizes. Our pricing includes:
        </p>
        <ul className="list-disc pl-5 mt-3">
          <li>Unlimited vehicle campaigns</li>
          <li>Automated ad generation</li>
          <li>VSP hosting and management</li>
          <li>Calendly integration</li>
          <li>Analytics and reporting</li>
        </ul>
        <p className="mt-3">
          <a href="/pricing" className="text-primary underline">View our current pricing plans</a> or contact us for custom enterprise solutions.
        </p>
      </>
    ),
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: (
      <>
        <p>
          Yes, you can cancel your subscription at any time with no cancellation fees. Your campaigns will remain active until the end of your current billing period, and you'll retain access to all analytics and reporting data.
        </p>
        <p className="mt-3">
          We also offer a 30-day money-back guarantee for new customers to ensure you're completely satisfied with our platform.
        </p>
      </>
    ),
  },
  {
    q: "Do I need technical knowledge to use Unique Leverage?",
    a: (
      <>
        <p>
          Not at all! Unique Leverage is designed for automotive professionals, not tech experts. Our platform features:
        </p>
        <ul className="list-disc pl-5 mt-3">
          <li>Simple, intuitive interface</li>
          <li>One-click ad generation</li>
          <li>Automated inventory syncing</li>
          <li>Pre-built templates and designs</li>
        </ul>
        <p className="mt-3">
          If you can use Facebook and manage inventory, you can use Unique Leverage. Our support team is also available to help with setup and optimization.
        </p>
      </>
    ),
  },
];
