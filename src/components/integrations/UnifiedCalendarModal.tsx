"use client";

import React from 'react';
import { ModalOverlay, Modal, Dialog } from '@/components/application/modals/modal';

interface CalendarIntegration {
  connected: boolean;
  accounts?: Array<{
    email: string;
    id: number;
  }>;
  loading: boolean;
}

interface UnifiedCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarIntegrations: {
    google: CalendarIntegration;
    microsoft: CalendarIntegration;
  };
  onGoogleConnect: () => void;
  onMicrosoftConnect: () => void;
  onGoogleDisconnect: (integrationId: number) => void;
  onMicrosoftDisconnect: (integrationId: number) => void;
}

export const UnifiedCalendarModal: React.FC<UnifiedCalendarModalProps> = ({
  isOpen,
  onClose,
  calendarIntegrations,
  onGoogleConnect,
  onMicrosoftConnect,
  onGoogleDisconnect,
  onMicrosoftDisconnect,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-auto my-4">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Calendar Integration
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
              </div>

              {/* Connected Accounts */}
              {(calendarIntegrations.google.connected || calendarIntegrations.microsoft.connected) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Connected Accounts
                  </h3>
                  <div className="space-y-2">
                    {calendarIntegrations.google.connected && calendarIntegrations.google.accounts?.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Google Calendar</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{account.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onGoogleDisconnect(account.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}

                    {calendarIntegrations.microsoft.connected && calendarIntegrations.microsoft.accounts?.map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#F25022" d="M1 1h10v10H1z"/>
                            <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                            <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                            <path fill="#FFB900" d="M13 13h10v10H13z"/>
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Microsoft Outlook</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{account.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onMicrosoftDisconnect(account.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Connect Additional Calendar */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                  {calendarIntegrations.google.connected || calendarIntegrations.microsoft.connected 
                    ? 'Connect Another Calendar' 
                    : 'Connect Your Calendar'
                  }
                </h3>
                
                <div className="space-y-3">
                  {/* Always show Google option - users can connect additional Gmail accounts */}
                  <div 
                    onClick={onGoogleConnect}
                    className="group relative p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-sm bg-white dark:bg-gray-900 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Google Calendar</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {calendarIntegrations.google.connected 
                              ? 'Connect another Gmail account' 
                              : 'Connect your Google account'
                            }
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Always show Microsoft option - users can connect additional Microsoft accounts */}
                  <div 
                    onClick={onMicrosoftConnect}
                    className="group relative p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-sm bg-white dark:bg-gray-900 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg viewBox="0 0 24 24" width="24" height="24">
                          <path fill="#F25022" d="M1 1h10v10H1z"/>
                          <path fill="#7FBA00" d="M13 1h10v10H13z"/>
                          <path fill="#00A4EF" d="M1 13h10v10H1z"/>
                          <path fill="#FFB900" d="M13 13h10v10H13z"/>
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Microsoft Outlook</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Office 365, Outlook.com, live.com, or hotmail calendar
                          </p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar to add events to */}
              {(calendarIntegrations.google.connected || calendarIntegrations.microsoft.connected) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Calendar to add events to
                  </h3>
                  
                  <div className="relative">
                    <select className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                      {calendarIntegrations.google.connected && calendarIntegrations.google.accounts?.map((account) => (
                        <option key={account.id} value={`google-${account.id}`}>
                          Google Calendar - {account.email}
                        </option>
                      ))}
                      {calendarIntegrations.microsoft.connected && calendarIntegrations.microsoft.accounts?.map((account) => (
                        <option key={account.id} value={`microsoft-${account.id}`}>
                          Outlook Calendar - {account.email}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Sync settings */}
              {(calendarIntegrations.google.connected || calendarIntegrations.microsoft.connected) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Sync settings
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Include buffers checkbox */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="include-buffers"
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex-1">
                        <label htmlFor="include-buffers" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Include buffers on this calendar
                        </label>
                      </div>
                      <div className="relative group">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          When checked, this will add any buffers you've set up on your event types to your synced calendar.
                        </div>
                      </div>
                    </div>

                    {/* Auto sync checkbox */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="auto-sync"
                        defaultChecked
                        className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex-1">
                        <label htmlFor="auto-sync" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Automatically sync changes from this calendar to Unique Leverage
                        </label>
                      </div>
                      <div className="relative group">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          Keep your availability updated automatically when calendar events change
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">How it works</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Your calendar events will show as unavailable to prevent double bookings. Events added to your selected calendar will be synced with your Unique Leverage scheduling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};