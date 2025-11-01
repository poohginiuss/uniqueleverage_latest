import React, { useState } from "react";
import { FeedRequestPanel } from "@/components/integrations/FeedRequestPanel";

function Divider() {
  return (
    <hr className="my-12 border-t-2 border-border-secondary" />
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="not-typography mx-auto w-full max-w-[72rem]">
      <h2 className="text-lg font-semibold text-primary md:text-xl">{title}</h2>
      {children}
    </section>
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

export const DealerCenterPage = () => {
  const faqs = [
    {
      q: "How do I connect my DealerCenter feed?",
      a: "Follow the DealerCenter instructions above to set up your feed connection. The process typically takes 10-15 minutes."
    },
    {
      q: "What information does DealerCenter provide?",
      a: "DealerCenter provides comprehensive vehicle data including pricing, specifications, images, and availability status."
    },
    {
      q: "How often does DealerCenter sync?",
      a: "DealerCenter feeds sync automatically every 2-4 hours to ensure your inventory is always up-to-date."
    },
    {
      q: "Can I connect multiple DealerCenter accounts?",
      a: "Yes, you can connect multiple DealerCenter accounts if you manage inventory for multiple dealerships."
    },
    {
      q: "What if I have issues with my DealerCenter connection?",
      a: "Contact our support team and we'll help troubleshoot any connection issues with your DealerCenter feed."
    }
  ];

  return (
    <div className="flex items-start px-4 py-16 lg:px-8">
      <main className="relative mx-auto flex w-full min-w-0 flex-1 flex-col lg:flex-row max-w-180">
        {/* Main column */}
        <div className="size-full text-tertiary">
          {/* Intro header */}
          <div className="mb-10">
            <div className="mb-6">
              <div
                className="relative flex shrink-0 items-center justify-center *:data-icon:size-7 bg-primary_alt ring-1 ring-inset before:absolute before:inset-1 before:shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1),0px_3px_3px_0px_rgba(0,0,0,0.09),1px_8px_5px_0px_rgba(0,0,0,0.05),2px_21px_6px_0px_rgba(0,0,0,0),0px_0px_0px_1px_rgba(0,0,0,0.08),1px_13px_5px_0px_rgba(0,0,0,0.01),0px_-2px_2px_0px_rgba(0,0,0,0.13)_inset] before:ring-1 before:ring-secondary_alt size-14 rounded-[14px] before:rounded-[10px] text-fg-secondary ring-primary dark:ring-secondary dark:before:opacity-0"
                data-featured-icon="true"
              >
                <div className="z-10">
                  {/* Star icon */}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="max-w-3xl text-2xl font-semibold text-primary">
                DealerCenter
              </h1>
            </div>

            <p className="typography mt-3 max-w-3xl text-base whitespace-pre-line">
              Connect your DealerCenter inventory feed to sync vehicles automatically.
            </p>
          </div>

          <Divider />

          {/* Integration Video Guide */}
          <Section id="send-feed-request" title="How to activate your DealerCenter feed?">
            <div className="mt-6 space-y-4">
              <p className="text-lg text-secondary">
                Watch the video below to learn how to activate your inventory feed in DealerCenter.
              </p>
              
              {/* Video Placeholder */}
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg max-w-4xl mx-auto">
                <div className="aspect-video relative">
                  {/* Placeholder for DealerCenter settings screenshot */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        DealerCenter Integration Guide
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        Video showing how to activate your inventory feed
                      </p>
                    </div>
                  </div>
                  
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-200">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Divider />

          {/* FAQs */}
          <div id="faqs" className="not-typography mx-auto w-full max-w-[72rem]">
            <h2 className="text-lg font-semibold text-primary md:text-xl">FAQs</h2>
            <p className="mt-3 text-base text-tertiary">
              Please refer to our frequently asked questions page for more.
            </p>

            <div className="mt-8 flex flex-col">
              {faqs.map((f, i) => (
                <FaqItem key={i} question={f.q} answer={f.a} />
              ))}
            </div>
          </div>

          
        </div>

        
      </main>
      {/* Right rail: On this page */}
      <aside className="sticky top-25 right-4 ml-10 hidden w-64 shrink-0 overflow-y-auto pb-10 text-sm xl:block">
        <div className="flex flex-col max-h-[calc(100vh-7rem)] pb-8">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4 text-fg-quaternary">
              <path d="M3 12h18M3 6h18M3 18h12"></path>
            </svg>
            <p className="text-xs font-semibold text-primary">On this page</p>
          </div>

          <nav className="mt-4">
            <ol className="flex flex-col gap-2 border-l border-secondary pl-3">
              {[
                { id: "send-feed-request", label: "Send Feed Request" },
                { id: "faqs", label: "FAQs" },
              ].map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="text-sm font-semibold text-quaternary hover:text-brand-secondary">
                    {t.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </aside>
    </div>
  );
};