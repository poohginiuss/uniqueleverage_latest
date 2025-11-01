'use client';

import React, { useState, useEffect } from 'react';
import { ModalOverlay, Modal, Dialog } from '@/components/application/modals/modal';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FacebookProfile {
  name: string;
  email: string;
}

interface AdAccount {
  id: string;
  name: string;
  accountId: string;
}

interface Page {
  id: string;
  pageId: string;
  name: string;
  category?: string;
  platform: string;
}

export default function SocialMediaModal({ isOpen, onClose }: SocialMediaModalProps) {
  const [facebookProfile, setFacebookProfile] = useState<FacebookProfile | null>(null);
  const [connectedPages, setConnectedPages] = useState<Page[]>([]);
  const [availableAdAccounts, setAvailableAdAccounts] = useState<AdAccount[]>([]);
  const [connectedAdAccounts, setConnectedAdAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'adaccounts'>('overview');

  useEffect(() => {
    if (isOpen) {
      fetchSocialMediaStatus();
    }
  }, [isOpen]);

  const fetchSocialMediaStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/integrations/social-media');
      if (response.ok) {
        const data = await response.json();
        setFacebookProfile(data.facebookProfile);
        setConnectedPages(data.connectedPages || []);
        setAvailableAdAccounts(data.availableAdAccounts || []);
        setConnectedAdAccounts(data.connectedAdAccounts || []);
      }
    } catch (error) {
      console.error('Error fetching social media status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookConnect = () => {
    window.location.href = '/api/auth/facebook/start';
  };

  const handleFacebookDisconnect = async () => {
    try {
      const response = await fetch('/api/integrations/social-media/facebook', {
        method: 'DELETE',
      });
      if (response.ok) {
        setFacebookProfile(null);
        setConnectedPages([]);
        setAvailableAdAccounts([]);
        setConnectedAdAccounts([]);
      }
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
    }
  };

  const handleAdAccountConnect = async (account: AdAccount) => {
    try {
      const response = await fetch('/api/integrations/social-media/ad-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          adAccountId: account.accountId,
          adAccountName: account.name
        }),
      });
      if (response.ok) {
        await fetchSocialMediaStatus();
      }
    } catch (error) {
      console.error('Error connecting ad account:', error);
    }
  };

  const handleAdAccountDisconnect = async (adAccountId: string) => {
    try {
      const response = await fetch('/api/integrations/social-media/ad-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adAccountId }),
      });
      if (response.ok) {
        await fetchSocialMediaStatus();
      }
    } catch (error) {
      console.error('Error disconnecting ad account:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full mx-auto my-4 max-h-[85vh] flex flex-col">
            <div className="p-6 overflow-y-auto flex-1">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Advertising Integration
                  </h2>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Connect your advertising accounts to create and manage campaigns
                </p>
              </div>

              {/* If Not Connected - Show Connect Card */}
              {!facebookProfile ? (
                <div className="flex items-center justify-center py-12">
                  <button
                    onClick={handleFacebookConnect}
                    className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                  >
                    <svg viewBox="0 0 24 24" width="48" height="48" className="mb-4">
                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Connect Facebook
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
                      Sign in to access your Pages and Ad Accounts
                    </p>
                  </button>
                </div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === 'overview'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('pages')}
                      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                        activeTab === 'pages'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Pages
                      {connectedPages.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {connectedPages.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('adaccounts')}
                      className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                        activeTab === 'adaccounts'
                          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                    >
                      Ad Accounts
                      {connectedAdAccounts.length > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          {connectedAdAccounts.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                      <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <svg viewBox="0 0 24 24" width="24" height="24">
                                <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{facebookProfile.name}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Facebook Account</p>
                              </div>
                            </div>
                            <button
                              onClick={handleFacebookDisconnect}
                              className="text-xs text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{connectedPages.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Connected Pages</p>
                          </div>
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{connectedAdAccounts.length}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Connected Ad Accounts</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pages Tab */}
                    {activeTab === 'pages' && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Business pages you granted access to during Facebook login
                        </p>
                        
                        {connectedPages.length > 0 ? (
                          <div className="space-y-2">
                            {connectedPages.map((page) => (
                              <div
                                key={page.id}
                                className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                              >
                                <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{page.name}</p>
                                  {page.category && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400">{page.category}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-sm">No pages connected yet</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ad Accounts Tab */}
                    {activeTab === 'adaccounts' && (
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Select which ad accounts to use for campaign management ({availableAdAccounts.length} available)
                        </p>
                        
                        {availableAdAccounts.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableAdAccounts.map((account) => {
                              const isConnected = connectedAdAccounts.some(connected => connected.accountId === account.accountId);
                              
                              return (
                                <div
                                  key={account.id}
                                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                                    isConnected 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-3 flex-1">
                                    <svg viewBox="0 0 24 24" width="20" height="20" className="flex-shrink-0">
                                      <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{account.name}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">ID: {account.accountId}</p>
                                    </div>
                                  </div>
                                  
                                  {isConnected ? (
                                    <button
                                      onClick={() => handleAdAccountDisconnect(account.accountId)}
                                      className="px-3 py-1.5 text-xs font-medium text-red-700 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      Disconnect
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleAdAccountConnect(account)}
                                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                    >
                                      Connect
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-sm">No ad accounts available</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Subtle loading indicator */}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
                    <span>Loading...</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

