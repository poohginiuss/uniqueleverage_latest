'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import EditableFacebookAdPreview from '@/components/marketing/EditableFacebookAdPreview';
import { AD_WIZARD_STEPS, STEP_QUESTIONS } from '@/lib/adWizard';

// Wizard Step Component - renders native UI for wizard steps
function WizardStepComponent({ step, wizardState, onSubmit }: { 
  step: number; 
  wizardState: any; 
  onSubmit: (value: string) => void; 
}) {
  const [inputValue, setInputValue] = useState('');

  console.log('🎯 WizardStepComponent rendering with step:', step, 'AD_WIZARD_STEPS.VEHICLE_SELECTION:', AD_WIZARD_STEPS.VEHICLE_SELECTION);

  // Step 1: Ad Type - Native buttons
  if (step === AD_WIZARD_STEPS.AD_TYPE) {
    console.log('✅ Rendering AD_TYPE buttons');
    return (
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => onSubmit('single')}
          className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all"
        >
          Single Vehicle
        </button>
        <button
          onClick={() => onSubmit('carousel')}
          className="flex-1 px-6 py-4 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm transition-all"
        >
          Carousel
        </button>
      </div>
    );
  }

  // Step 2: Vehicle Selection
  if (step === AD_WIZARD_STEPS.VEHICLE_SELECTION) {
    console.log('✅ Rendering VEHICLE_SELECTION - user should use bottom search bar');
    // Show a prominent message prompting the user to use the bottom search bar
    return (
      <div className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Search for a vehicle
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Use the search bar below to find a vehicle by make, model, or stock number
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Other steps: No UI - user uses bottom search bar
  return null;
}

interface Message {
    id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  action?: string;
  searchResults?: any[];
  wizardStep?: {
    step: number;
    question: string;
    wizardState: any;
  };
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export default function MarketingWizardPlayground() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [welcomeInputValue, setWelcomeInputValue] = useState('');
  const [chatInputValue, setChatInputValue] = useState('');
  const [bottomInputValue, setBottomInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persistentPreview, setPersistentPreview] = useState<any>(null);
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isNewChat, setIsNewChat] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestInProgressRef = useRef(false);
  const lastRequestTimeRef = useRef(0);
  const conversationsLoadedRef = useRef(false);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const loadConversations = async (forceReload = false) => {
    try {
      setIsLoadingConversations(true);
      console.log('🔄 Loading conversations...', forceReload ? '(forced)' : '');
      const response = await fetch('/api/conversation?customerId=1');
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Conversations data:', data);
        setConversations(data.conversations || []);
        conversationsLoadedRef.current = true;
        setIsLoadingConversations(false);
        return true;
      } else {
        console.error('❌ Failed to load conversations:', response.status, response.statusText);
        setIsLoadingConversations(false);
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to load conversations:', error);
      setIsLoadingConversations(false);
      return false;
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      console.log('🔄 Loading conversation:', conversationId);
      const response = await fetch(`/api/conversation/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Conversation data:', data);
        
        // Transform API messages to frontend format
        const transformedMessages = (data.messages || []).map((msg: any) => ({
          id: msg.id.toString(),
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.createdAt)
        }));
        
        setMessages(transformedMessages);
        setSessionId(conversationId);
        setCurrentTitle(data.title || '');
        setIsNewChat(false);

        const url = new URL(window.location.href);
        url.searchParams.set('conversation', conversationId);
        window.history.pushState({}, '', url.toString());

        console.log('✅ Conversation loaded successfully');
      } else {
        console.error('❌ Failed to load conversation:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to load conversation:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    console.log('deleteConversation called with ID:', conversationId);
    try {
      console.log('Making DELETE request to:', `/api/conversation/${conversationId}`);
      const response = await fetch(`/api/conversation/${conversationId}`, {
        method: 'DELETE',
      });
      console.log('Delete response status:', response.status);
      if (response.ok) {
        console.log('Delete successful, updating UI');
        
        // Update conversations list immediately
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== conversationId);
          console.log('Updated conversations list:', filtered.length, 'conversations remaining');
          return filtered;
        });
        
        if (sessionId === conversationId) {
          setMessages([]);
          setSessionId(null);
          setCurrentTitle('');
          setPersistentPreview(null);
          
          // Clean URL when returning to welcome screen
          const url = new URL(window.location.href);
          url.searchParams.delete('conversation');
          window.history.pushState({}, '', url.toString());
        }
        
        // Clear the delete confirmation
        setDeleteConfirmId(null);
        console.log('Delete process completed successfully');
      } else {
        console.error('Delete failed with status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };



  const handleWelcomeKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoading && !requestInProgressRef.current) {
        const text = welcomeInputValue.trim();
        if (text) {
          // Clear the welcome screen search bar
          setWelcomeInputValue('');
          // Start the conversation
          handleSendMessageFromWelcome(text);
        }
      }
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoading && !requestInProgressRef.current) {
        handleSendMessageFromChat();
      }
    }
  };

  const handleBottomKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      if (!isLoading && !requestInProgressRef.current) {
        // Use bottom input value for the message
        const text = bottomInputValue.trim();
        if (text) {
          setChatInputValue(text); // Set the chat input value
          setBottomInputValue(''); // Clear the bottom input
          handleSendMessageFromChat();
        }
      }
    }
  };

  const handleSendMessageFromWelcome = async (text: string) => {
    if (!text.trim() || isLoading || requestInProgressRef.current) return;

    // Prevent duplicate requests
    requestInProgressRef.current = true;
    const currentTime = Date.now();
    if (currentTime - lastRequestTimeRef.current < 1000) {
      requestInProgressRef.current = false;
      return;
    }
    lastRequestTimeRef.current = currentTime;

    setIsLoading(true);

    const newMessage: Message = {
      id: generateUniqueId(),
      content: text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          conversationHistory: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          })),
          sessionId: sessionId,
          generateTitle: true,
          isNewChat: true
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send message: ${errorData}`);
      }

      const data = await response.json();
      console.log('📋 API Response:', data);

      if (data.searchResults && data.searchResults.length > 0) {
        const searchMessage: Message = {
          id: generateUniqueId(),
          content: data.response || `I found ${data.searchResults.length} vehicles matching your criteria:`,
          isUser: false,
          timestamp: new Date(),
          searchResults: data.searchResults,
          wizardStep: data.wizardStep
        };
        setMessages(prev => [...prev, searchMessage]);
      } else if (data.response) {
        const responseMessage: Message = {
          id: generateUniqueId(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          wizardStep: data.wizardStep
        };
        setMessages(prev => [...prev, responseMessage]);
      }

      if (data.persistentPreview) {
        setPersistentPreview(data.persistentPreview);
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        setIsNewChat(false);

        const url = new URL(window.location.href);
        url.searchParams.set('conversation', data.sessionId);
        window.history.pushState({}, '', url.toString());

        // Add new conversation to local state
        const newConversation = {
          id: data.sessionId,
          title: data.title || 'New Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setConversations(prev => [newConversation, ...prev]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
    setIsLoading(false);
      requestInProgressRef.current = false;
    }
  };

  const handleSendMessageFromChat = async () => {
    if (!chatInputValue.trim() || isLoading || requestInProgressRef.current) return;

    // Prevent duplicate requests
    requestInProgressRef.current = true;
    const currentTime = Date.now();
    if (currentTime - lastRequestTimeRef.current < 1000) {
      requestInProgressRef.current = false;
      return;
    }
    lastRequestTimeRef.current = currentTime;

    const text = chatInputValue.trim();
    const isNewChat = messages.length === 0;
    setChatInputValue('');
    setIsLoading(true);

    const newMessage: Message = {
      id: generateUniqueId(),
      content: text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          conversationHistory: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          })),
          sessionId: sessionId,
          generateTitle: isNewChat,
          isNewChat: isNewChat
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send message: ${errorData}`);
      }

      const data = await response.json();
      console.log('📋 API Response:', data);

      if (data.searchResults && data.searchResults.length > 0) {
        const searchMessage: Message = {
          id: generateUniqueId(),
          content: data.response || `I found ${data.searchResults.length} vehicles matching your criteria:`,
          isUser: false,
          timestamp: new Date(),
          searchResults: data.searchResults,
          wizardStep: data.wizardStep
        };
        setMessages(prev => [...prev, searchMessage]);
      } else if (data.response) {
        const responseMessage: Message = {
          id: generateUniqueId(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          wizardStep: data.wizardStep
        };
        setMessages(prev => [...prev, responseMessage]);
      }

      if (data.persistentPreview) {
        setPersistentPreview(data.persistentPreview);
      }

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
        setIsNewChat(false);

        const url = new URL(window.location.href);
        url.searchParams.set('conversation', data.sessionId);
        window.history.pushState({}, '', url.toString());

        // Add new conversation to local state
        const newConversation = {
          id: data.sessionId,
          title: data.title || 'New Chat',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setConversations(prev => [newConversation, ...prev]);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  };

  const handleWizardStepSubmit = async (value: string) => {
    console.log('🎯 handleWizardStepSubmit called with value:', value);
    console.log('🎯 Current messages.length:', messages.length);
    
    if (!sessionId || isLoading || requestInProgressRef.current) return;

    // Prevent duplicate requests
    requestInProgressRef.current = true;
    const currentTime = Date.now();
    if (currentTime - lastRequestTimeRef.current < 1000) {
      requestInProgressRef.current = false;
      return;
    }
    lastRequestTimeRef.current = currentTime;

    setIsLoading(true);

    try {
      // Send directly to API without showing user message
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: value,
          conversationHistory: messages.map(msg => ({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.content
          })),
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send message: ${errorData}`);
      }

      const data = await response.json();
      console.log('📋 Wizard Step Response:', data);
      console.log('📋 wizardStep data:', data.wizardStep);

      // Only show the AI response, not the user's click
      if (data.response) {
        const responseMessage: Message = {
          id: generateUniqueId(),
          content: data.response,
          isUser: false,
          timestamp: new Date(),
          searchResults: data.searchResults, // Include searchResults for vehicle cards
          wizardStep: data.wizardStep
        };
        console.log('📋 Creating message with wizardStep:', responseMessage.wizardStep);
        console.log('📋 Message content:', responseMessage.content);
        console.log('📋 Message content length:', responseMessage.content.length);
        setMessages(prev => {
          console.log('📋 Total messages before add:', prev.length);
          const updated = [...prev, responseMessage];
          console.log('📋 Total messages after add:', updated.length);
          return updated;
        });
      }

      if (data.persistentPreview) {
        setPersistentPreview(data.persistentPreview);
      }

    } catch (error) {
      console.error('Error sending wizard step:', error);
      const errorMessage: Message = {
        id: generateUniqueId(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      requestInProgressRef.current = false;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      // Only load conversations if not already loaded
      if (!conversationsLoadedRef.current) {
        const success = await loadConversations(false);
        
        if (success) {
          // Check if there's a conversation ID in the URL
          const urlParams = new URLSearchParams(window.location.search);
          const conversationId = urlParams.get('conversation');
          
          if (conversationId) {
            console.log('🔄 Loading conversation from URL:', conversationId);
            await loadConversation(conversationId);
          }
        } else {
          // Only retry once if there's a connection issue
          console.log('🔄 Retrying conversation load once...');
          setTimeout(async () => {
            await loadConversations(false);
          }, 2000);
        }
      }
    };
    initializePage();
  }, []);

  // Clean URL when on welcome screen
  useEffect(() => {
    if (!sessionId && window.location.search.includes('conversation=')) {
      // User is on welcome screen but URL still has conversation parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('conversation');
      window.history.pushState({}, '', url.toString());
      console.log('🧹 Cleaned URL for welcome screen');
    }
  }, [sessionId]);

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const conversationId = urlParams.get('conversation');
      
      if (conversationId && conversationId !== sessionId) {
        // User navigated to a different conversation
        loadConversation(conversationId);
      } else if (!conversationId && sessionId) {
        // User navigated back to welcome screen
        setSessionId(null);
        setMessages([]);
        setCurrentTitle('');
        setPersistentPreview(null);
        setIsNewChat(true);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
    
    return (
        <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-0 shadow-none marketing-wizard page-transition content-area" style={{minHeight: '100vh'}}>
            <header className="max-lg:hidden sticky top-0 z-50">
                <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700">
          <Breadcrumbs type="button">
                        <Breadcrumbs.Item href="#">GPT</Breadcrumbs.Item>
                        <Breadcrumbs.Item href="#">Ad Wizard</Breadcrumbs.Item>
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
                        {/* Account Menu */}
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

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex">
            <div className="flex-1 flex flex-col min-h-0">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-32" style={{width: '768px', marginLeft: '148px'}}>
          <div className="text-center mb-12">
            <h1 className="text-[32px] font-normal text-gray-900 dark:text-white leading-[40px] tracking-[-0.01em]">
              Ready when you are.
            </h1>
                </div>
          
          <div className="w-full max-w-3xl">
            <div className="relative">
              <div className="flex items-center bg-white dark:bg-gray-900 rounded-[24px] px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-200">
                <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
          </button>
                
                <input
                  value={welcomeInputValue}
                  onChange={(e) => setWelcomeInputValue(e.target.value)}
                  onKeyPress={handleWelcomeKeyPress}
                  placeholder="Ask anything"
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 text-[16px] leading-[24px] font-normal"
                  disabled={isLoading}
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

          <div className="grid grid-cols-2 gap-4 mt-12 w-full max-w-3xl">
                  <button 
              onClick={() => {
                handleSendMessageFromWelcome("Show me the ad preview demo");
              }}
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
                  <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200 mb-1">
                Campaigns
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-1 min-h-[1.25rem]">
                    Manage and customize your Facebook ads
                  </div>
                </div>
                    </div>
                  </button>

              <button
              onClick={() => {
                // Send the message directly without setting input value
                handleSendMessageFromWelcome("Create a Facebook ad campaign");
              }}
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
                  <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 mb-1">
                Ad Wizard
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-1 min-h-[1.25rem]">
                    Create targeted Facebook and Instagram ads
                  </div>
                </div>
                    </div>
                  </button>
                  
                  <button
              onClick={() => {
                handleSendMessageFromWelcome("Analyze my ad performance");
              }}
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
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
                    Contacts
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Review performance metrics and insights
                  </div>
                      </div>
                    </div>
                  </button>

                          <button
              onClick={() => {
                handleSendMessageFromWelcome("Help me follow up with leads");
              }}
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
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-200">
                    Automations
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Manage customer communication
                  </div>
                </div>
                      </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0" style={{height: 'calc(100vh - 120px)'}}>
          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-8 pb-24" style={{maxHeight: 'calc(100vh - 120px)'}}>
            <div className="space-y-6" style={{width: '735px', marginLeft: '148px'}}>
              {messages.map((message, index) => {
                // Find the last message with wizardStep to render UI only for that one
                const wizardStepMessages = messages
                  .map((m, i) => m.wizardStep ? i : -1)
                  .filter(i => i !== -1);
                const lastWizardStepIndex = wizardStepMessages.pop();
                const isLastWizardStep = lastWizardStepIndex !== undefined && index === lastWizardStepIndex;
                
                return (
                <React.Fragment key={message.id}>
                <div className="w-full">
                  {/* Message bubble */}
                  <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.isUser 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                  
                  {/* Vehicle cards - render below message bubble to span full width */}
                  {message.searchResults && message.searchResults.length > 0 && (
                    <div className="w-full mt-4 space-y-3">
                      {message.searchResults.map((vehicle, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start p-3">
                              {/* Large Vehicle Image */}
                              <div className="flex-shrink-0 w-32 h-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                                <img 
                                  src={vehicle.images?.[0] || '/placeholder-car.jpg'} 
                                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder-car.jpg';
                                  }}
                                />
                              </div>
                              
                              {/* Vehicle Details */}
                              <div className="flex-1 min-w-0 ml-3 mr-2">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                  {(vehicle.body_style || vehicle.bodyStyle || vehicle.condition || '').replace('_', ' ')} {vehicle.transmission ? `• ${vehicle.transmission}` : '• AUTO'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                  {vehicle.color || 'N/A'} • Stock #{vehicle.stock_number || vehicle.stockNumber || 'N/A'}
                                </p>
                                
                                {/* Price and Mileage */}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                                    ${typeof vehicle.price === 'string' ? vehicle.price.replace(/[^0-9.]/g, '') : vehicle.price?.toLocaleString() || 'Call'}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-500">
                                    {(vehicle.mileage_value || vehicle.mileage || 0).toLocaleString()} MI
                                  </span>
                                </div>
                              </div>
                              
                              {/* Selection Checkbox - Modern and minimal */}
                              <div className="ml-2">
                                <input
                                  type="checkbox"
                                  checked={selectedVehicles.has(vehicle.stock_number || vehicle.stockNumber || index.toString())}
                                  onChange={(e) => {
                                    const vehicleId = vehicle.stock_number || vehicle.stockNumber || index.toString();
                                    setSelectedVehicles(prev => {
                                      const newSet = new Set(prev);
                                      if (e.target.checked) {
                                        newSet.add(vehicleId);
                                      } else {
                                        newSet.delete(vehicleId);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  title="Select for ad creation"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </React.Fragment>
                );
              })}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
              <div ref={messagesEndRef} />
      </div>
    </div>
        </div>
      )}

      {/* Search bar in sticky container at bottom - hidden on welcome screen */}
      {messages.length > 0 && (
        <div className="fixed bottom-0 p-4 z-30" style={{left: '50%', transform: 'translateX(-50%)', width: '768px', marginLeft: '16px'}}>
        <div className="flex items-center bg-white dark:bg-gray-900 rounded-[24px] px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-200">
          <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
              <input 
            value={chatInputValue}
            onChange={(e) => setChatInputValue(e.target.value)}
            onKeyPress={handleChatKeyPress}
                  placeholder="Ask anything"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 text-[16px] leading-[24px] font-normal"
                  disabled={isLoading}
                />
            
          <div className="flex items-center space-x-1">
            <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
                <button
              onClick={() => {
                setMessages([]);
                setPersistentPreview(null);
                setWelcomeInputValue('');
                setChatInputValue('');
                setBottomInputValue('');
                setSessionId(null);
                setCurrentTitle('');
                setIsNewChat(true);
                
                // Clear conversation from URL
                const url = new URL(window.location.href);
                url.searchParams.delete('conversation');
                window.history.pushState({}, '', url.toString());
              }}
              className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Back to Welcome Screen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
          </button>
        </div>
    </div>
    </div>
      )}

          {persistentPreview && (
            <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50">
              <EditableFacebookAdPreview
                vehicle={persistentPreview.vehicle}
                adType={persistentPreview.adType}
                budget={persistentPreview.budget}
                targeting={persistentPreview.targeting}
                adCopy={persistentPreview.adCopy}
                onUpdate={(field, value) => {
                  setPersistentPreview((prev: any) => ({
                    ...prev,
                    adCopy: {
                      ...prev.adCopy,
                      [field]: value
                    }
                  }));
                }}
              />
            </div>
          )}


        {/* Right rail: Chat Navigation */}
        <aside className="fixed top-32 right-4 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block z-30">
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
                setMessages([]);
                setPersistentPreview(null);
                setWelcomeInputValue('');
                setChatInputValue('');
                setBottomInputValue('');
                setSessionId(null);
                setIsNewChat(true);
                setCurrentTitle('');

                const url = new URL(window.location.href);
                url.searchParams.delete('conversation');
                window.history.pushState({}, '', url.toString());
              }}
              className="text-sm font-semibold text-quaternary hover:text-brand-secondary text-left"
            >
              + New Chat
            </button>
            
            {conversations.map((conversation) => (
              <div key={conversation.id} className={`text-sm text-left w-full text-start p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                conversation.id === sessionId 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' 
                  : ''
              }`}>
                <button
                  onClick={() => loadConversation(conversation.id)}
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
                        onClick={() => {
                          console.log('Delete button clicked for conversation:', conversation.id);
                          deleteConversation(conversation.id);
                        }}
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
        </aside>
          </div>
        </div>
      </div>
        </div>
    </main>
  );
}