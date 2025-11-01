"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Import all page components
import DocsIntroductionPage from '@/app/docs/introduction/page';
import DocsRequestFeedsPage from '@/app/docs/request-feeds/page';
import DocsIntegrationsPage from '@/app/docs/integrations/page';
import InventoryAllPage from '@/app/inventory/all/page';
import MarketingWizardPage from '@/app/gpt/wizard/page';

const pageComponents = {
  '/docs/introduction': DocsIntroductionPage,
  '/docs/request-feeds': DocsRequestFeedsPage,
  '/docs/integrations': DocsIntegrationsPage,
  '/inventory/all': InventoryAllPage,
  '/gpt/wizard': MarketingWizardPage,
};

export function SmoothPageSwitcher() {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState(pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (pathname !== currentPage) {
      setIsTransitioning(true);
      
      // Very short transition delay
      setTimeout(() => {
        setCurrentPage(pathname);
        setIsTransitioning(false);
      }, 50);
    }
  }, [pathname, currentPage]);

  const CurrentComponent = pageComponents[currentPage as keyof typeof pageComponents];

  if (!CurrentComponent) {
    return <div>Page not found</div>;
  }

  return (
    <div 
      className={`transition-opacity duration-75 ease-in-out ${
        isTransitioning ? 'opacity-95' : 'opacity-100'
      }`}
    >
      <CurrentComponent />
    </div>
  );
}
