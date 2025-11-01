"use client";

import React, { useState, useEffect } from 'react';
import { ModalOverlay, Modal, Dialog, DialogTrigger } from '@/components/application/modals/modal';
import { Button } from '@/components/base/buttons/button';
import { Badge } from '@/components/base/badges/badges';

interface Calendar {
  integration_id: number;
  calendar_id: string;
  calendar_name: string;
  calendar_email: string;
  is_primary: boolean;
  is_selected: boolean;
  color: string;
  timezone: string;
}

interface CalendarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (selectedCalendarIds: string[]) => void;
  provider: 'google' | 'microsoft';
  connectedEmail?: string;
}

export const CalendarSelectionModal: React.FC<CalendarSelectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  provider,
  connectedEmail,
}) => {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendars, setSelectedCalendars] = useState<Set<string>>(new Set());
  const [eventCalendarId, setEventCalendarId] = useState<string>('');
  const [includeBuffers, setIncludeBuffers] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCalendars();
    }
  }, [isOpen]);

  const fetchCalendars = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/integrations/calendars');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCalendars(data.calendars);
          const initialSelected = new Set<string>(data.calendars.filter((cal: Calendar) => cal.is_selected).map((cal: Calendar) => cal.calendar_id));
          setSelectedCalendars(initialSelected);
          
          // Set default event calendar to primary calendar
          const primaryCalendar = data.calendars.find((cal: Calendar) => cal.is_primary);
          if (primaryCalendar) {
            setEventCalendarId(primaryCalendar.calendar_id);
          }
        } else {
          setError(data.error || 'Failed to fetch calendars');
        }
      } else {
        const errorData = await response.json();
        if (response.status === 503) {
          setError('Database connection timeout. Please refresh the page and try again.');
        } else {
          setError(errorData.error || 'Failed to fetch calendars');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred while fetching calendars.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (calendarId: string, isChecked: boolean) => {
    setSelectedCalendars(prev => {
      const newSelection = new Set(prev);
      if (isChecked) {
        newSelection.add(calendarId);
      } else {
        newSelection.delete(calendarId);
      }
      return newSelection;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Update each calendar selection individually
      const updatePromises = calendars.map(calendar => 
        fetch('/api/integrations/calendars', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            calendarId: calendar.calendar_id,
            isSelected: selectedCalendars.has(calendar.calendar_id)
          }),
        })
      );
      
      const responses = await Promise.all(updatePromises);
      const failedResponse = responses.find(response => !response.ok);
      
      if (failedResponse) {
        const errorData = await failedResponse.json();
        setError(errorData.error || 'Failed to save calendar selections');
        return;
      }
      
      // All updates successful
      onSave(Array.from(selectedCalendars));
      onClose();
    } catch (err) {
      setError('An unexpected error occurred while saving calendars.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    if (provider === 'google') {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded">
          <svg viewBox="0 0 24 24" width="16" height="16" className="text-white">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          </svg>
        </div>
      );
    } else if (provider === 'microsoft') {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded">
          <svg viewBox="0 0 24 24" width="16" height="16" className="text-white">
            <path fill="currentColor" d="M1 1h10v10H1z"/>
            <path fill="currentColor" d="M13 1h10v10H13z"/>
          </svg>
        </div>
      );
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={onClose}>
      <Modal>
        <Dialog>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Calendar settings</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Set which calendars we use to check for busy times
                </p>
                <div className="mt-4 border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading calendars...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600 dark:text-red-400">
                  <p className="mb-2">Error: {error}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Please try again.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Calendars to check for conflicts */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Calendars to check for conflicts
                      </h3>
                      <Button color="secondary" size="sm">
                        + Connect calendar account
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      These calendars will be used to prevent double bookings.
                    </p>
                    
                    <div className="space-y-3">
                      {calendars.map((calendar) => (
                        <div key={calendar.calendar_id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                          <div className="flex items-center space-x-3">
                            {getProviderIcon(provider)}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
                                </span>
                                {calendar.is_primary && (
                                  <Badge color="blue" size="sm">Primary</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {calendar.calendar_email || calendar.calendar_name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-blue-600 dark:text-blue-400">
                              Checking {selectedCalendars.has(calendar.calendar_id) ? '1' : '0'} calendar
                            </span>
                            <input
                              type="checkbox"
                              id={`conflict-${calendar.calendar_id}`}
                              checked={selectedCalendars.has(calendar.calendar_id)}
                              onChange={(e) => handleCheckboxChange(calendar.calendar_id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <button className="text-gray-400 hover:text-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar to add events to */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Calendar to add events to
                    </h3>
                    <div className="relative">
                      <select
                        value={eventCalendarId}
                        onChange={(e) => setEventCalendarId(e.target.value)}
                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none pr-10"
                      >
                        {calendars.map((calendar) => (
                          <option key={calendar.calendar_id} value={calendar.calendar_id}>
                            {calendar.calendar_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Sync settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                      Sync settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="include-buffers"
                          checked={includeBuffers}
                          onChange={(e) => setIncludeBuffers(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="include-buffers" className="text-sm text-gray-900 dark:text-gray-100">
                          Include buffers on this calendar
                        </label>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="auto-sync"
                          checked={autoSync}
                          onChange={(e) => setAutoSync(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="auto-sync" className="text-sm text-gray-900 dark:text-gray-100">
                          Automatically sync changes from this calendar to Unique Leverage
                        </label>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button color="secondary" onClick={onClose} disabled={saving}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                      {saving ? 'Saving...' : 'Save settings'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};