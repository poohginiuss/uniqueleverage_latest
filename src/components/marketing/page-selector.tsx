'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/base/buttons/button';

interface Page {
  id: string;
  name: string;
  category: string;
  access_token: string;
}

interface PageSelectorProps {
  onPageSelected: (page: Page) => void;
  onCancel: () => void;
}

export function PageSelector({ onPageSelected, onCancel }: PageSelectorProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/facebook/pages');
      const result = await response.json();
      
      if (result.success) {
        setPages(result.pages);
        if (result.selectedPageId) {
          const selected = result.pages.find((p: Page) => p.id === result.selectedPageId);
          if (selected) {
            setSelectedPage(selected);
          }
        }
      } else {
        setError(result.error || 'Failed to fetch pages');
      }
    } catch (err) {
      setError('Failed to connect to Facebook');
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = async (page: Page) => {
    try {
      const response = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: page.id,
          pageName: page.name,
          pageCategory: page.category,
          pageAccessToken: page.access_token
        })
      });

      const result = await response.json();
      
      if (result.success) {
        onPageSelected(page);
      } else {
        setError(result.error || 'Failed to select page');
      }
    } catch (err) {
      setError('Failed to select page');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your Facebook pages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Pages
            </h3>
          </div>
        </div>
        <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error}</p>
        <div className="flex gap-2">
          <Button onClick={fetchPages} color="secondary" size="sm">
            Try Again
          </Button>
          <Button onClick={onCancel} color="secondary" size="sm">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              No Pages Found
            </h3>
          </div>
        </div>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          You don't have any Facebook pages connected to your account. Please create a Facebook page first, then try again.
        </p>
        <Button onClick={onCancel} color="secondary" size="sm">
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Select Your Facebook Page
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Choose which Facebook page you want to use for your ads. This will be the page that appears in your ad creative.
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedPage?.id === page.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setSelectedPage(page)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {page.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {page.category.replace(/_/g, ' ')}
                </p>
              </div>
              {selectedPage?.id === page.id && (
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => selectedPage && handlePageSelect(selectedPage)}
          disabled={!selectedPage}
          className="flex-1"
        >
          Use Selected Page
        </Button>
        <Button onClick={onCancel} color="secondary">
          Cancel
        </Button>
      </div>
    </div>
  );
}
