"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  searchResults?: any[];
  wizardStep?: {
    step: number;
    question: string;
    wizardState: any;
  };
}

export default function WizardPage() {
    const router = useRouter();
  const { theme, setTheme } = useTheme();
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
  // Conversation management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const conversationsLoadedRef = useRef(false);

  // Message state
  const [messages, setMessages] = useState<Message[]>([]);
  const [welcomeInputValue, setWelcomeInputValue] = useState('');
  const [chatInputValue, setChatInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const requestInProgressRef = useRef(false);
  const lastRequestTimeRef = useRef(0);

  // Load conversations
  const loadConversations = async () => {
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

  // Load conversations on mount
  useEffect(() => {
    if (!conversationsLoadedRef.current) {
      loadConversations();
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const generateUniqueId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleWelcomeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = welcomeInputValue.trim();
      if (text && !isLoading) {
        handleSendMessageFromWelcome(text);
      }
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageFromChat();
    }
  };

  const handleSendMessageFromWelcome = async (text: string) => {
    if (!text.trim() || isLoading || requestInProgressRef.current) return;

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
    setWelcomeInputValue('');

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

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId);
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

    requestInProgressRef.current = true;
    const currentTime = Date.now();
    if (currentTime - lastRequestTimeRef.current < 1000) {
      requestInProgressRef.current = false;
        return;
      }
    lastRequestTimeRef.current = currentTime;

    setIsLoading(true);

    const text = chatInputValue.trim();
    const newMessage: Message = {
      id: generateUniqueId(),
      content: text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setChatInputValue('');

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
          generateTitle: false,
          isNewChat: false
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to send message: ${errorData}`);
      }

      const data = await response.json();

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
    
    return (
    <main className="min-w-0 flex-1 bg-white dark:bg-gray-950 pb-0 shadow-none lg:bg-white dark:lg:bg-gray-950 page-transition content-area">
            <header className="max-lg:hidden sticky top-0 z-50">
                <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700">
                    <Breadcrumbs type="button">
            <Breadcrumbs.Item href="#">GPT</Breadcrumbs.Item>
            <Breadcrumbs.Item href="#">Wizard</Breadcrumbs.Item>
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
                                <NavAccountMenu onClose={() => setIsAccountMenuOpen(false)} />
                            </Popover>
                        </DialogTrigger>
                </div>
                </section>
            </header>

      <div className="flex items-start px-4 py-16 lg:px-8">
        <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
          {/* Main column */}
          <div className="size-full text-tertiary">
            {/* Welcome Screen */}
            <>
              {/* Ready when you are section */}
                  <div className="mt-32 mb-10 lg:mt-10">
                    <div className="text-center mb-6">
                      <h2 className="text-[32px] font-normal text-primary leading-[40px] tracking-[-0.01em]">
                        Ready when you are.
                      </h2>
            </div>
        
                    {/* Search bar */}
                    <div className={`${welcomeInputValue 
                      ? 'absolute bottom-0 left-1/2 -translate-x-1/2 z-30 p-4 lg:p-0 w-full max-w-3xl' 
                      : 'fixed bottom-0 left-0 right-0 z-30 p-4 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:p-0 mb-6 lg:mb-6 w-full max-w-3xl mx-auto'
                    }`}>
                      <div className="relative">
                        <div className="flex items-center bg-white dark:bg-gray-900 rounded-[24px] px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-200">
                          <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                  
                                <input
                                  type="text"
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

                  {/* Four Action Cards */}
                  <div className="grid grid-cols-2 gap-4 mt-2 w-full max-w-3xl mx-auto bg-yellow-200">
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
          </>
            </div>

        
      </main>
      {/* Right rail: Recent/Chats sidebar */}
      <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
            <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
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
                            className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Delete
                      </button>
                  <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                            Cancel
                  </button>
      </div>
                </div>
              )}
            </div>
                ))}
              </div>
              </div>
          </aside>
          </div>
    </main>
  );
}
