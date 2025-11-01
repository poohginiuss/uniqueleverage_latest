"use client";

import { SystemTheme } from "@/providers/system-theme";
import { SidebarNavigationSimple } from "@/components/landing/docs/sidebar-docs";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { useTheme } from "next-themes";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { useRef, useState, useEffect, Suspense } from "react";
import { AuthHandler } from "@/components/auth/auth-handler";
import { useRouter } from "next/navigation";

interface Conversation {
    id: string;
    title: string;
    createdAt: string;
}

export default function TestPage() {
    const { theme, setTheme } = useTheme();
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const router = useRouter();
    const [welcomeInputValue, setWelcomeInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<{ id: string; content: string; isUser: boolean; searchResults?: any[]; wizardStep?: any }[]>([]);
    const [chatInputValue, setChatInputValue] = useState("");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const conversationsLoadedRef = useRef(false);

    const loadConversations = async (forceReload = false) => {
        try {
            setIsLoadingConversations(true);
            const response = await fetch('/api/conversation?customerId=1');
            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
                conversationsLoadedRef.current = true;
                setIsLoadingConversations(false);
                return true;
            } else {
                setIsLoadingConversations(false);
                return false;
            }
        } catch (error) {
            setIsLoadingConversations(false);
            return false;
        }
    };

    const loadConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/conversation/${conversationId}`);
            if (response.ok) {
                const data = await response.json();
                const transformedMessages = (data.messages || []).map((msg: any) => ({
                    id: msg.id.toString(),
                    content: msg.content,
                    isUser: msg.role === 'user',
                    timestamp: new Date(msg.createdAt),
                    searchResults: msg.searchResults,
                    wizardStep: msg.wizardStep
                }));
                setMessages(transformedMessages);
                setSessionId(conversationId);
            }
        } catch (error) {
            console.error('Failed to load conversation:', error);
        }
    };

    const deleteConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/conversation/${conversationId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                if (sessionId === conversationId) {
                    setMessages([]);
                    setSessionId(null);
                    setChatInputValue('');
                    setWelcomeInputValue('');
                }
                setDeleteConfirmId(null);
            }
        } catch (error) {
            console.error('Failed to delete conversation:', error);
        }
    };

    const handleWelcomeKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && welcomeInputValue.trim()) {
            e.preventDefault();
            setIsLoading(true);
            const text = welcomeInputValue.trim();
            setWelcomeInputValue("");
            const userMsg = { id: `${Date.now()}-u`, content: text, isUser: true };
            setMessages((prev) => [...prev, userMsg]);

            try {
                const response = await fetch('/api/conversation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: text,
                        conversationHistory: [],
                        sessionId: sessionId,
                        generateTitle: true,
                        isNewChat: true
                    }),
                });
                const data = await response.json();
                if (data?.response || (data?.searchResults && data.searchResults.length > 0)) {
                    const aiMsg = { id: `${Date.now()}-a`, content: data.response || '', isUser: false, searchResults: data.searchResults, wizardStep: data.wizardStep };
                    setMessages((prev) => [...prev, aiMsg]);
                }
                if (data?.sessionId && !sessionId) {
                    setSessionId(data.sessionId);
                    const newConversation = {
                        id: data.sessionId,
                        title: data.title || 'New Chat',
                        createdAt: new Date().toISOString(),
                    };
                    setConversations(prev => [newConversation, ...prev]);
                }
            } catch (err) {
                setMessages((prev) => [...prev, { id: `${Date.now()}-e`, content: 'Sorry, something went wrong. Try again.', isUser: false }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleChatKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && chatInputValue.trim() && !isLoading) {
            e.preventDefault();
            const text = chatInputValue.trim();
            setChatInputValue("");
            const userMsg = { id: `${Date.now()}-u`, content: text, isUser: true };
            setMessages((prev) => [...prev, userMsg]);
            setIsLoading(true);
            try {
                const response = await fetch('/api/conversation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: text,
                        conversationHistory: messages.map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.content })),
                        sessionId: sessionId,
                        generateTitle: messages.length === 0,
                        isNewChat: messages.length === 0
                    }),
                });
                const data = await response.json();
                if (data?.response || (data?.searchResults && data.searchResults.length > 0)) {
                    const aiMsg = { id: `${Date.now()}-a`, content: data.response || '', isUser: false, searchResults: data.searchResults, wizardStep: data.wizardStep };
                    setMessages((prev) => [...prev, aiMsg]);
                }
                if (data?.sessionId && !sessionId) {
                    setSessionId(data.sessionId);
                    const newConversation = {
                        id: data.sessionId,
                        title: data.title || 'New Chat',
                        createdAt: new Date().toISOString(),
                    };
                    setConversations(prev => [newConversation, ...prev]);
                }
            } catch (err) {
                setMessages((prev) => [...prev, { id: `${Date.now()}-e`, content: 'Sorry, something went wrong. Try again.', isUser: false }]);
            } finally {
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const hasOverflow = container.scrollHeight > container.clientHeight + 2;
        if (hasOverflow) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const initializeConversations = async () => {
            if (!conversationsLoadedRef.current) {
                await loadConversations(false);
            }
        };
        initializeConversations();
    }, []);

    return (
        <SystemTheme>
            <Suspense fallback={null}>
                <AuthHandler />
            </Suspense>
            <div className="flex flex-col lg:flex-row">
                <SidebarNavigationSimple
                    activeUrl="/gpt/test"
                    items={[
                        {
                            label: "Getting started",
                            href: "/",
                            items: [
                                { label: "Introduction", href: "/gpt/test" },
                                { label: "Request Feed", href: "/docs/request-feeds" },
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
                />
                <main className={`min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 shadow-none lg:bg-primary dark:lg:bg-gray-950 page-transition content-area ${messages.length === 0 ? 'pb-12' : ''}`}>
                    <header className="max-lg:hidden sticky top-0 z-50 ">
                        <section
                            className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700"
                        >
                            <Breadcrumbs type="button">
                                <Breadcrumbs.Item href="#">Docs</Breadcrumbs.Item>
                                <Breadcrumbs.Item href="#">Getting started</Breadcrumbs.Item>
                                <Breadcrumbs.Item href="#">Introduction</Breadcrumbs.Item>
                            </Breadcrumbs>
                            <div className="flex items-center gap-3">
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
                    
                    <div className={`flex items-start px-4 lg:px-8 ${messages.length > 0 ? 'pt-0 pb-0 h-[calc(100vh-3.75rem)]' : 'py-16'}`}>
                        <main className={`relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180 ${messages.length > 0 ? 'h-full overflow-hidden' : ''}`}>
                            <div className="size-full text-tertiary">
                                {/* Ready when you are section */}
                                {messages.length === 0 && (
                                    <div className="mt-32 mb-6 lg:mt-10">
                                        <div className="text-center mb-6">
                                            <h2 className="text-[32px] font-normal text-primary leading-[40px] tracking-[-0.01em]">
                                                Ready when you are.
                                            </h2>
                                        </div>
                                
                                        {/* Search bar - always visible on welcome; conversation starts on Enter */}
                                        <div className="fixed bottom-0 left-0 right-0 z-30 p-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:p-0 mb-0 lg:mb-6 w-full max-w-3xl mx-auto">
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
                                    </div>
                                )}

                                {/* Bottom search on welcome removed; chat input appears only after first message */}

                                {/* Chat messages and bottom input during chat */}
                                {messages.length > 0 && (
                                    <div className="flex-1 flex flex-col min-h-0" style={{height: 'calc(100vh - 120px)'}}>
                                        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-8 pb-20">
                                            <div className="space-y-4 max-w-3xl mx-auto">
                                                {messages.map((m) => (
                                                    <div key={m.id} className="w-full">
                                                        <div className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
                                                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}`}>
                                                                <div className="whitespace-pre-wrap">{m.content}</div>
                                                            </div>
                                                        </div>
                                                        {m.searchResults && m.searchResults.length > 0 && (
                                                            <div className="w-full mt-4 space-y-3">
                                                                {m.searchResults.map((vehicle, index) => (
                                                                    <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="flex items-start p-3">
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
                                                                                <div className="flex items-center gap-3 mt-2">
                                                                                    <span className="text-green-600 dark:text-green-400 font-semibold text-sm">
                                                                                        ${typeof vehicle.price === 'string' ? vehicle.price.replace(/[^0-9.]/g, '') : (vehicle.price?.toLocaleString?.() || 'Call')}
                                                                                    </span>
                                                                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                                                                        {(vehicle.mileage_value || vehicle.mileage || 0).toLocaleString()} MI
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
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
                                        <div className="fixed bottom-0 left-0 right-0 z-30 p-0 w-full lg:absolute lg:bottom-0 lg:left-1/2 lg:-translate-x-1/2 lg:p-0 lg:w-full">
                                            <div className="relative">
                                            <div className="flex items-center bg-white dark:bg-gray-900 rounded-[24px] px-4 py-3 border border-gray-200 dark:border-gray-700 shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-200">
                                                <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                </button>
                                                <input
                                                    type="text"
                                                        value={chatInputValue}
                                                        onChange={(e) => setChatInputValue(e.target.value)}
                                                        onKeyPress={handleChatKeyPress}
                                                    placeholder="Ask anything"
                                                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 px-3 py-2 text-[16px] leading-[24px] font-normal"
                                                    disabled={isLoading}
                                                />
                                                <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => {
                                                                setMessages([]);
                                                                setChatInputValue('');
                                                                setWelcomeInputValue('');
                                                                setSessionId(null);
                                                            }}
                                                            className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                            title="Back to Welcome Screen"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                                                            </svg>
                                                        </button>
                                                    <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                                        </svg>
                                                    </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Four Action Cards */}
                                {messages.length === 0 && (
                                <div className="grid grid-cols-2 gap-4 mt-2 w-full max-w-3xl mx-auto">
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
                                )}
                            </div>
                        </main>
                        {/* Right rail: TOC (hide during chat) */}
                        <aside className={`sticky top-[calc(3.75rem+4rem)] right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block ${messages.length > 0 ? 'hidden' : ''}`}>
                            <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
                                <div className="flex items-center gap-1.5">
                                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-fg-quaternary">
                                        <path d="M3 12h18M3 6h18M3 18h12"></path>
                                    </svg>
                                    <p className="text-xs font-semibold text-primary">Archive</p>
                                </div>

                                <nav className="mt-4">
                                    <ol className="flex flex-col gap-2 border-l border-secondary pl-3">
                                        {isLoadingConversations ? (
                                            <li className="text-sm text-quaternary">Loading...</li>
                                        ) : conversations.length > 0 ? (
                                            conversations.map((conversation) => (
                                                <li key={conversation.id} className="group">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => loadConversation(conversation.id)}
                                                            className={`flex-1 text-sm font-semibold text-left ${conversation.id === sessionId ? 'text-brand-secondary' : 'text-quaternary hover:text-brand-secondary'}`}
                                                        >
                                                            {conversation.title}
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteConfirmId(conversation.id);
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-700 transition-opacity"
                                                            title="Delete conversation"
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
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-sm text-quaternary">No conversations yet</li>
                                        )}
                                    </ol>
                                </nav>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </SystemTheme>
    );
}
