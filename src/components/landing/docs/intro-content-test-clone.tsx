import React, { useState, useEffect, useRef } from "react";
import { FaApple, FaWindows } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useInventoryStatus } from "@/hooks/use-inventory-status";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export const ULIntroPageClone = ({ showWelcomeSection = false }: { showWelcomeSection?: boolean }) => {
  const router = useRouter();
  const [userProgress, setUserProgress] = useState({
    step1Completed: false,
    step2Completed: false,
    step3Completed: false,
  });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const conversationsLoadedRef = useRef(false);

  const { status: connectionStatus, loading: statusLoading, shouldShowProcessing, connectedCount } = useInventoryStatus();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch('/api/user-progress');
        if (response.ok) {
          const data = await response.json();
          setUserProgress(data);
        }
      } catch {}
    };
    fetchProgress();
  }, []);

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
    } finally {
      setIsLoadingConversations(false);
    }
  };

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
                  {/* Star icon placeholder */}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="max-w-3xl text-2xl font-semibold text-primary">
                Introduction
              </h1>
            </div>

            <p className="typography mt-3 max-w-3xl text-base whitespace-pre-line">
              Welcome to Unique Leverage! This platform is a collection of tools and integrations built specifically for automotive dealerships and sales professionals.
            </p>
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
        </div>

        
      </main>
      {/* Right rail: Recent/Chats (wizard) or On this page (docs) */}
      <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
        <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
          {showWelcomeSection ? (
            // Recent/Chats sidebar for wizard page - not needed for clone
            <div className="space-y-4">
              {/* Placeholder */}
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
};

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
