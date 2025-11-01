"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { ChevronDown } from "@untitledui/icons";
import { DialogTrigger, Popover, Button as AriaButton } from "react-aria-components";
import { NavAccountMenu } from "@/components/application/app-navigation/base-components/nav-account-card";
import { FaApple, FaWindows } from "react-icons/fa";
import { fetchVehicleData, Vehicle } from "@/lib/vehicle-data";
import AudienceMap from "@/components/marketing/audience-map";
import VehiclePreview from "@/components/marketing/vehicle-preview";

export default function WizardPage() {
    const router = useRouter();
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    
  // Theme is now handled by the global ThemeProvider
    
    return (
        <main className="min-w-0 flex-1 bg-secondary_subtle dark:bg-gray-950 pb-12 shadow-none marketing-wizard page-transition content-area">
            <header className="max-lg:hidden sticky top-0 z-50">
                <section className="flex h-15 pl-7 pr-7 w-full items-center justify-between bg-primary dark:bg-gray-950 md:h-15 border-b border-secondary dark:border-gray-700">
                    <Breadcrumbs type="button">
                        <Breadcrumbs.Item href="#">Marketing</Breadcrumbs.Item>
                        <Breadcrumbs.Item href="#">Ad Wizard</Breadcrumbs.Item>
                    </Breadcrumbs>
                    <div className="flex items-center gap-3">
                        {/* Dark Mode Toggle - Desktop Only */}
                        <button 
                            onClick={() => {
                                const html = document.documentElement;
                                const isDark = html.classList.contains('dark-mode');
                                if (isDark) {
                                    html.classList.remove('dark-mode');
                                    localStorage.setItem('theme', 'light');
                                } else {
                                    html.classList.add('dark-mode');
                                    localStorage.setItem('theme', 'dark');
                                }
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

            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="mx-auto max-w-7xl">
                    <MarketingWizard />
                </div>
            </div>
        </main>
    );
}

const MarketingWizard = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [promotionType, setPromotionType] = useState<'single' | 'set' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [destination, setDestination] = useState<'vsp' | 'messenger' | ''>('');
  const [headline, setHeadline] = useState('');
  const [primaryText, setPrimaryText] = useState('');
  const [callToAction, setCallToAction] = useState('Shop Now');
  const [hasGeneratedAdCopy, setHasGeneratedAdCopy] = useState(false);

  // Note: Both headline and primary text are now empty by default for manual control
  const [budget, setBudget] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Function to generate creative ad copy variations
  const generateAdCopy = () => {
    if (selectedVehicles.length > 0) {
      const vehicle = selectedVehicles[0];
      const mileage = vehicle.mileage ? `${vehicle.mileage.value.toLocaleString()} ${vehicle.mileage.unit}` : 'N/A';
      const location = vehicle.address ? `${vehicle.address.city}, ${vehicle.address.region}` : 'Milwaukee, WI';
      const dealerName = vehicle.dealerName || 'Autoplex MKE';
      const description = vehicle.description || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

      // Headline variations
      const headlines = [
        `${vehicle.year} ${vehicle.make} ${vehicle.model} - READY TO DRIVE!`,
        `🔥 LIMITED TIME: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `Dream Car Alert: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `BEST DEAL: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `💎 LUXURY: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `⚡ FAST SALE: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `🏆 QUALITY: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `🚗 FAMILY READY: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `🗺️ ADVENTURE: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `💸 SAVE BIG: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `✅ INSPECTED: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        `🎯 PERFECT: ${vehicle.year} ${vehicle.make} ${vehicle.model}`
      ];

      // Primary text variations with different styles and CTAs
      const primaryTextVariations = [
        // Style 1: Direct and informative
        `🚗 ${vehicle.year} ${vehicle.make} ${vehicle.model} - READY TO DRIVE!\n\n💰 Price: $${vehicle.price.toLocaleString()}\n📏 Mileage: ${mileage}\n📍 Located at ${dealerName} in ${location}\n\nDon't miss out on this amazing deal!`,

        // Style 2: Urgency focused
        `🔥 LIMITED TIME OFFER! 🔥\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\nOnly $${vehicle.price.toLocaleString()}!\n\n✅ ${mileage} miles\n✅ Located in ${location}\n\nCall ${dealerName} today!`,

        // Style 3: Lifestyle focused
        `Dream car alert! 🚗✨\n\nThis ${vehicle.year} ${vehicle.make} ${vehicle.model} is calling your name!\n\n💵 $${vehicle.price.toLocaleString()}\n🛣️ ${mileage} miles\n\nVisit ${dealerName} in ${location} to take it home!`,

        // Style 4: Value focused
        `BEST DEAL IN ${location.toUpperCase()}! 🎯\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n📊 ${mileage} miles\n🏢 ${dealerName}\n\nThis won't last long!`,

        // Style 5: Simple and clean
        `FOR SALE!\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\nPrice: $${vehicle.price.toLocaleString()}\nMileage: ${mileage}\n\n${dealerName} • ${location}`,

        // Style 6: Family focused
        `👨‍👩‍👧‍👦 Perfect for the whole family!\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n🚗 ${mileage} miles\n🏠 ${dealerName} in ${location}\n\nMake memories that last!`,

        // Style 7: Luxury focused
        `💎 LUXURY AWAITS! 💎\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n✨ ${mileage} miles\n🏆 ${dealerName} • ${location}\n\nExperience the difference!`,

        // Style 8: Adventure focused
        `🗺️ ADVENTURE STARTS HERE! 🗺️\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n🏔️ ${mileage} miles\n🌍 ${dealerName} in ${location}\n\nYour next journey awaits!`,

        // Style 9: Savings focused
        `💸 SAVE BIG TODAY! 💸\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n📉 ${mileage} miles\n🏪 ${dealerName} • ${location}\n\nDon't pay full price elsewhere!`,

        // Style 10: Quality focused
        `🏅 QUALITY YOU CAN TRUST! 🏅\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n🔍 ${mileage} miles\n🏢 ${dealerName} in ${location}\n\nInspection guaranteed!`,

        // Style 11: Speed focused
        `⚡ FAST DEAL! ⚡\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n🏃 ${mileage} miles\n⚡ ${dealerName} • ${location}\n\nQuick sale, great price!`,

        // Style 12: Professional focused
        `💼 PROFESSIONAL GRADE! 💼\n\n${vehicle.year} ${vehicle.make} ${vehicle.model}\n$${vehicle.price.toLocaleString()}\n\n📊 ${mileage} miles\n🏢 ${dealerName} in ${location}\n\nBuilt for success!`,

        // Style 13: Emoji heavy
        `🚗✨ ${vehicle.year} ${vehicle.make} ${vehicle.model} ✨🚗\n\n💰 $${vehicle.price.toLocaleString()} 💰\n🛣️ ${mileage} miles 🛣️\n📍 ${dealerName} in ${location} 📍\n\n🎉 Don't wait! 🎉`,

        // Style 14: Question format
        `Looking for the perfect ${vehicle.year} ${vehicle.make} ${vehicle.model}? 🤔\n\nLook no further! This beauty is ready to go!\n\n💵 $${vehicle.price.toLocaleString()}\n📏 ${mileage} miles\n🏢 ${dealerName} • ${location}\n\nContact us today!`,

        // Style 15: Story format
        `Once upon a time... there was a ${vehicle.year} ${vehicle.make} ${vehicle.model} 🚗\n\nThis isn't a fairy tale - it's real!\n\n💰 $${vehicle.price.toLocaleString()}\n🛣️ ${mileage} miles\n🏢 ${dealerName} in ${location}\n\nYour story starts here!`
      ];

      // Call to action variations
      const ctaVariations = [
        'Shop Now', 'Learn More', 'Get Details', 'View Now', 'See More', 
        'Call Now', 'Visit Us', 'Book Test Drive', 'Get Quote', 'Contact Us',
        'Buy Now', 'Reserve', 'Inquire', 'Schedule Visit', 'Find Out More'
      ];

      // Pick random variations
      const randomHeadline = headlines[Math.floor(Math.random() * headlines.length)];
      const randomPrimaryText = primaryTextVariations[Math.floor(Math.random() * primaryTextVariations.length)];

    // Set the generated content (only headline and primary text)
    setHeadline(randomHeadline);
    setPrimaryText(randomPrimaryText);
    setHasGeneratedAdCopy(true);
  }
};
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableSets, setAvailableSets] = useState<any[]>([]);
  const [budgetError, setBudgetError] = useState('');
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Popular emojis for car ads
  const popularEmojis = [
    '🚗', '🚙', '🚘', '🚖', '🚔', '🚓', '🚑', '🚒', '🚐', '🚚',
    '💰', '💵', '💸', '💳', '💎', '🏆', '⭐', '✨', '🔥', '💯',
    '✅', '🎯', '⚡', '🚀', '🏔️', '🗺️', '🌍', '🏠', '🏢', '📍',
    '👨‍👩‍👧‍👦', '👑', '🛡️', '🔍', '📊', '📉', '🏃', '💼', '🎪', '🎉',
    '😍', '🤩', '😎', '👍', '👏', '🙌', '🎊', '🎈', '🎁', '💝'
  ];

  // Function to insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const textarea = document.querySelector('textarea[placeholder="Describe your vehicle or promotion..."]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = primaryText;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setPrimaryText(newText);
      
      // Set cursor position after the emoji and auto-resize
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
        autoResizeTextarea(textarea);
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // Function to auto-resize textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    // Set height to scrollHeight to fit content
    textarea.style.height = textarea.scrollHeight + 'px';
    // Ensure minimum height matches the style minHeight
    if (textarea.scrollHeight < 80) {
      textarea.style.height = '80px';
    }
  };

  // Handle textarea change with auto-resize
  const handlePrimaryTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrimaryText(e.target.value);
    autoResizeTextarea(e.target);
  };

  // Auto-resize textarea when primaryText changes (e.g., from generate button)
  useEffect(() => {
    if (textareaRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        autoResizeTextarea(textareaRef.current!);
      }, 0);
    }
  }, [primaryText]);

  // Track when user manually enters headline
  useEffect(() => {
    if (headline.trim() !== '') {
      setHasGeneratedAdCopy(true);
    }
  }, [headline]);
  const [newSetName, setNewSetName] = useState('');
  const [selectedVehiclesForSet, setSelectedVehiclesForSet] = useState<Vehicle[]>([]);
  const [setCreationMethod, setSetCreationMethod] = useState<'criteria' | 'manual'>('criteria');
  const [savedSets, setSavedSets] = useState<Array<{id: string, name: string, filters: Array<{id: string, attribute: string, condition: string, value: string | string[]}>, filterLogic: 'all' | 'any'}>>([]);
  const [selectedSavedSet, setSelectedSavedSet] = useState<string>('');
  const [showSaveSetOption, setShowSaveSetOption] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [setCriteria, setSetCriteria] = useState({
    priceMin: '',
    priceMax: '',
    yearMin: '',
    yearMax: '',
    makes: [] as string[],
    bodyStyles: [] as string[],
    mileageMax: ''
  });
  const [filterLogic, setFilterLogic] = useState<'all' | 'any'>('all');
  const [filters, setFilters] = useState<Array<{
    id: string;
    attribute: string;
    condition: string;
    value: string | string[];
  }>>([]);

  // Audience targeting state
  const [targetingLocations, setTargetingLocations] = useState<Array<{
    id: string;
    name: string;
    type: 'city' | 'state' | 'county' | 'zip';
    lat: number;
    lng: number;
    radius: number;
  }>>([]);
  const [demographics, setDemographics] = useState({
    minAge: 25,
    maxAge: 65
  });
  const [automotiveInterests, setAutomotiveInterests] = useState<string[]>([]);
  const [hasAttemptedStep4Continue, setHasAttemptedStep4Continue] = useState(false);
  
  // Facebook campaign creation state
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [availablePages, setAvailablePages] = useState<Array<{id: string, pageId: string, name: string}>>([]);
  const [realAudienceSize, setRealAudienceSize] = useState<number | null>(null);
  const [isLoadingAudience, setIsLoadingAudience] = useState(false);
  const [connectedAdAccountId, setConnectedAdAccountId] = useState<string>('');

  // Fetch user's Facebook pages and ad account on mount
  useEffect(() => {
    const fetchUserPages = async () => {
      try {
        const response = await fetch('/api/integrations/social-media');
        const data = await response.json();
        
        if (data.connectedPages && data.connectedPages.length > 0) {
          setAvailablePages(data.connectedPages);
          // Auto-select first page
          setSelectedPageId(data.connectedPages[0].pageId);
        }
        
        // Store connected ad account ID for audience insights
        if (data.connectedAdAccounts && data.connectedAdAccounts.length > 0) {
          setConnectedAdAccountId(data.connectedAdAccounts[0].accountId);
        }
      } catch (error) {
        console.error('Error fetching user pages:', error);
      }
    };
    
    fetchUserPages();
  }, []);

  // Debounced search
  const MIN_SEARCH_LENGTH = 2;
  const DEBOUNCE_DELAY = 300;

  // Evaluation functions for filtering
  const evaluateStringCondition = (vehicleValue: string, condition: string, filterValue: string | string[]) => {
    if (!filterValue || filterValue === '') return true;
    
    const values = Array.isArray(filterValue) ? filterValue : [filterValue];
    const vehicleVal = vehicleValue.toLowerCase();
    
    switch (condition) {
      case 'is':
        return values.some(v => vehicleVal === v.toLowerCase());
      case 'is_not':
        return !values.some(v => vehicleVal === v.toLowerCase());
      case 'is_any_of':
        return values.some(v => vehicleVal === v.toLowerCase());
      case 'is_not_any_of':
        return !values.some(v => vehicleVal === v.toLowerCase());
      case 'contains':
        return values.some(v => vehicleVal.includes(v.toLowerCase()));
      case 'not_contains':
        return !values.some(v => vehicleVal.includes(v.toLowerCase()));
      case 'starts_with':
        return values.some(v => vehicleVal.startsWith(v.toLowerCase()));
      case 'ends_with':
        return values.some(v => vehicleVal.endsWith(v.toLowerCase()));
      default:
        return true;
    }
  };

  const evaluateNumberCondition = (vehicleValue: number, condition: string, filterValue: string | string[]) => {
    if (!filterValue || filterValue === '') return true;
    
    const numValue = typeof filterValue === 'string' ? parseFloat(filterValue) : parseFloat(filterValue[0]);
    if (isNaN(numValue)) return true;
    
    const numValue2 = Array.isArray(filterValue) && filterValue.length > 1 ? parseFloat(filterValue[1]) : null;
    
    switch (condition) {
      case 'equals':
        return vehicleValue === numValue;
      case 'not_equals':
        return vehicleValue !== numValue;
      case 'greater_than':
        return vehicleValue > numValue;
      case 'less_than':
        return vehicleValue < numValue;
      case 'between':
        return numValue2 !== null ? vehicleValue >= numValue && vehicleValue <= numValue2 : true;
      default:
        return true;
    }
  };

  // Memoize filtered vehicles to ensure re-rendering
  const filteredVehicles = useMemo(() => {
    if (filters.length === 0) return vehicles;
    if (vehicles.length === 0) return [];
    
    return vehicles.filter(vehicle => {
      const results = filters.map(filter => {
        const attribute = filter.attribute;
        const condition = filter.condition;
        const value = filter.value;
        
        switch (attribute) {
          case 'make':
            return evaluateStringCondition(vehicle.make, condition, value);
          case 'model':
            return evaluateStringCondition(vehicle.model, condition, value);
          case 'trim':
            return evaluateStringCondition(vehicle.trim || 'Unknown', condition, value);
          case 'year':
            return evaluateNumberCondition(vehicle.year, condition, value);
          case 'bodyStyle':
            return evaluateStringCondition(vehicle.bodyStyle, condition, value);
          case 'price':
            return evaluateNumberCondition(vehicle.price, condition, value);
          case 'mileage':
            return evaluateNumberCondition(vehicle.mileage.value, condition, value);
          case 'fuelType':
            return evaluateStringCondition(vehicle.fuelType || 'Unknown', condition, value);
          case 'transmission':
            return evaluateStringCondition(vehicle.transmission || 'Unknown', condition, value);
          case 'drivetrain':
            return evaluateStringCondition(vehicle.drivetrain || 'Unknown', condition, value);
          case 'exteriorColor':
            return evaluateStringCondition(vehicle.exteriorColor || 'Unknown', condition, value);
          case 'interiorColor':
            return evaluateStringCondition(vehicle.interiorColor || 'Unknown', condition, value);
          case 'condition':
            return evaluateStringCondition(vehicle.condition || 'Unknown', condition, value);
          case 'vehicleType':
            return evaluateStringCondition(vehicle.vehicleType || 'Unknown', condition, value);
          case 'dealerName':
            return evaluateStringCondition(vehicle.dealerName || 'Unknown', condition, value);
          default:
            return true;
        }
      });
      
      return filterLogic === 'all' ? results.every(r => r) : results.some(r => r);
    });
  }, [filters, filterLogic, vehicles]);


  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= MIN_SEARCH_LENGTH) {
        setDebouncedSearchQuery(searchQuery);
        setIsSearching(false); // No spinner for instant client-side filtering
      } else {
        setDebouncedSearchQuery('');
        setIsSearching(false);
      }
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load vehicle data
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        const vehicleData = await fetchVehicleData();
        setVehicles(vehicleData);
        
        // Calculate actual vehicle counts for each body style that exists in the data
        const calculateSetCounts = (vehicles: Vehicle[]) => {
          // Get all unique body styles from the actual data
          const bodyStyles = [...new Set(vehicles.map(v => v.bodyStyle))].filter(Boolean);
          
          // Create collections based on actual body styles in the data
          const collections = bodyStyles.map((bodyStyle, index) => {
            const count = vehicles.filter(v => v.bodyStyle === bodyStyle).length;
            return {
              id: index + 1,
              name: bodyStyle,
              count: count,
              description: `${count} vehicles`,
              bodyStyle: bodyStyle
            };
          });
          
          // Sort by count (highest first) and only show collections with vehicles
          return collections.filter(c => c.count > 0).sort((a, b) => b.count - a.count);
        };
        
        setAvailableSets(calculateSetCounts(vehicleData));
      } catch (error) {
        console.error('Error loading vehicles:', error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };
    
    loadVehicles();
  }, []);

  // Filter vehicles based on search
  const searchFilteredVehicles = vehicles.filter(vehicle => {
    if (!debouncedSearchQuery) return false;
    
    const searchTerm = debouncedSearchQuery.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(searchTerm) ||
      vehicle.model.toLowerCase().includes(searchTerm) ||
      vehicle.year.toString().includes(searchTerm) ||
      vehicle.bodyStyle.toLowerCase().includes(searchTerm)
    );
  });

  // Budget validation
  const validateBudget = () => {
    if (!budget || !selectedDuration) {
      setBudgetError('');
      return;
    }

    const budgetAmount = parseFloat(budget);
    let minimumRequired = 20;

    if (selectedDuration === '3months') {
      minimumRequired = 100;
    } else if (selectedDuration === '30days') {
      minimumRequired = 50;
    } else if (selectedDuration === 'custom' && customStartDate && customEndDate) {
      const days = Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24));
      minimumRequired = days * 4;
    }

    if (budgetAmount < minimumRequired) {
      setBudgetError(`Minimum budget required: $${minimumRequired}`);
    } else {
      setBudgetError('');
    }
  };

  // Validate budget when budget or duration changes
  useEffect(() => {
    validateBudget();
  }, [budget, selectedDuration, customStartDate, customEndDate]);

  // Handlers
  const handlePromotionTypeChange = (type: 'single' | 'set') => {
    setPromotionType(type);
    setSelectedVehicles([]);
    setSelectedSet(null);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    if (promotionType === 'single') {
      setSelectedVehicles([vehicle]);
    }
  };

  const handleSetSelect = (set: any) => {
    setSelectedSet(set);
    // Filter vehicles by the body style of the selected set
    const setVehicles = vehicles.filter(v => v.bodyStyle === set.bodyStyle);
    setSelectedVehicles(setVehicles);
  };

  const handleCreateSet = () => {
    if (newSetName.trim() && selectedVehiclesForSet.length > 0) {
      const newSet = {
        id: Date.now(), // Simple ID generation
        name: newSetName.trim(),
        count: selectedVehiclesForSet.length,
        description: 'Custom vehicle collection',
        vehicles: selectedVehiclesForSet
      };
      
      setAvailableSets(prev => [...prev, newSet]);
      setSelectedSet(newSet);
      setSelectedVehicles([]);
      setShowCreateSet(false);
      setNewSetName('');
      setSelectedVehiclesForSet([]);
      setSelectedSavedSet('');
      setShowSaveSetOption(false);
      setCurrentStep(2);
    }
  };

  const handleVehicleToggleForSet = (vehicle: Vehicle) => {
    setSelectedVehiclesForSet(prev => {
      const isSelected = prev.some(v => v.id === vehicle.id);
      if (isSelected) {
        return prev.filter(v => v.id !== vehicle.id);
      } else {
        return [...prev, vehicle];
      }
    });
  };

  // Automotive-specific attributes and conditions
  const vehicleAttributes = [
    { value: 'make', label: 'Make' },
    { value: 'model', label: 'Model' },
    { value: 'trim', label: 'Trim' },
    { value: 'year', label: 'Year' },
    { value: 'bodyStyle', label: 'Body Style' },
    { value: 'price', label: 'Price' },
    { value: 'mileage', label: 'Mileage' },
    { value: 'fuelType', label: 'Fuel Type' },
    { value: 'transmission', label: 'Transmission' },
    { value: 'drivetrain', label: 'Drivetrain' },
    { value: 'exteriorColor', label: 'Exterior Color' },
    { value: 'interiorColor', label: 'Interior Color' },
    { value: 'condition', label: 'Condition' },
    { value: 'vehicleType', label: 'Vehicle Type' },
    { value: 'dealerName', label: 'Dealer Name' }
  ];

  const getConditionsForAttribute = (attribute: string) => {
    switch (attribute) {
      case 'make':
      case 'model':
      case 'trim':
      case 'bodyStyle':
      case 'fuelType':
      case 'transmission':
      case 'drivetrain':
      case 'exteriorColor':
      case 'interiorColor':
      case 'condition':
      case 'vehicleType':
      case 'dealerName':
        return [
          { value: 'contains', label: 'contains' },
          { value: 'starts_with', label: 'starts with' },
          { value: 'ends_with', label: 'ends with' },
          { value: 'is', label: 'is exactly' },
          { value: 'is_not', label: 'is not' },
          { value: 'not_contains', label: 'does not contain' }
        ];
      case 'year':
      case 'price':
      case 'mileage':
        return [
          { value: 'equals', label: 'equals' },
          { value: 'not_equals', label: 'does not equal' },
          { value: 'greater_than', label: 'is greater than' },
          { value: 'less_than', label: 'is less than' },
          { value: 'between', label: 'is between' }
        ];
      default:
        return [{ value: 'equals', label: 'equals' }];
    }
  };

  const getValueOptionsForAttribute = (attribute: string) => {
    const uniqueValues = [...new Set(vehicles.map(v => {
      switch (attribute) {
        case 'make': return v.make;
        case 'model': return v.model;
        case 'bodyStyle': return v.bodyStyle;
        case 'fuelType': return v.fuelType;
        case 'transmission': return v.transmission;
        case 'drivetrain': return v.drivetrain;
        case 'exteriorColor': return v.exteriorColor;
        case 'interiorColor': return v.interiorColor;
        case 'condition': return v.condition;
        case 'vehicleType': return v.vehicleType;
        case 'dealerName': return v.dealerName;
        default: return '';
      }
    }).filter(Boolean))].sort();
    
    return uniqueValues.map(value => ({ value, label: value }));
  };



  const addFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      attribute: 'make',
      condition: 'is',
      value: ''
    };
    setFilters(prev => [...prev, newFilter]);
  };

  const updateFilter = (filterId: string, field: string, value: string | string[]) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId 
        ? { ...filter, [field]: value }
        : filter
    ));
  };

  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
  };

  const getUniqueValuesForAttribute = (attribute: string) => {
    const values = vehicles.map(vehicle => {
      switch (attribute) {
        case 'make': return vehicle.make;
        case 'model': return vehicle.model;
        case 'trim': return vehicle.trim || 'Unknown';
        case 'bodyStyle': return vehicle.bodyStyle;
        case 'fuelType': return vehicle.fuelType || 'Unknown';
        case 'transmission': return vehicle.transmission || 'Unknown';
        case 'drivetrain': return vehicle.drivetrain || 'Unknown';
        case 'exteriorColor': return vehicle.exteriorColor || 'Unknown';
        case 'interiorColor': return vehicle.interiorColor || 'Unknown';
        case 'condition': return vehicle.condition || 'Unknown';
        case 'vehicleType': return vehicle.vehicleType || 'Unknown';
        case 'dealerName': return vehicle.dealerName || 'Unknown';
        default: return '';
      }
    }).filter(value => value && value !== 'Unknown');
    
    return [...new Set(values)].sort();
  };

  const handleCreateSetFromFilters = () => {
    if (newSetName.trim()) {
      const matchingVehicles = filteredVehicles;
      const newSet = {
        id: Date.now(),
        name: newSetName.trim(),
        count: matchingVehicles.length,
        description: 'Custom vehicle collection',
        vehicles: matchingVehicles,
        filters: filters,
        filterLogic: filterLogic
      };
      
      setAvailableSets(prev => [...prev, newSet]);
      setSelectedSet(newSet);
    setSelectedVehicles([]);
      setShowCreateSet(false);
      setNewSetName('');
      setFilters([]);
      setFilterLogic('all');
      setSelectedSavedSet('');
      setShowSaveSetOption(false);
      
      // Save to saved sets if checkbox is checked
      if (showSaveSetOption) {
        const savedSet = {
          id: `saved_${Date.now()}`,
          name: newSetName.trim(),
          filters: filters.map(filter => ({
            ...filter,
            id: `filter_${Date.now()}_${Math.random()}`
          })),
          filterLogic: filterLogic
        };
        setSavedSets(prev => [...prev, savedSet]);
        setShowSaveConfirmation(true);
        // Hide confirmation after 3 seconds
        setTimeout(() => setShowSaveConfirmation(false), 3000);
      }
      
      setCurrentStep(2);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Fetch real audience size from Facebook
  const fetchRealAudienceSize = async () => {
    if (!connectedAdAccountId || (targetingLocations.length === 0 && automotiveInterests.length === 0)) {
      return;
    }
    
    setIsLoadingAudience(true);
    
    try {
      const requestData = {
        locations: targetingLocations,
        interests: automotiveInterests,
        ageMin: demographics.minAge,
        ageMax: demographics.maxAge,
        adAccountId: connectedAdAccountId
      };
      
      console.log('Sending audience insights request:', requestData);
      
      const response = await fetch('/api/facebook/audience-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        console.log('Audience insights API not available, using fallback calculation');
        // Use fallback calculation when API is not available
        let fallbackReach = 0;
        
        targetingLocations.forEach(location => {
          if (location.type === 'state') {
            fallbackReach += 4000000; // ~4M for Wisconsin
          } else if (location.type === 'county') {
            fallbackReach += 950000; // ~950K for Milwaukee County
          } else if (location.type === 'city') {
            fallbackReach += location.radius * 50000; // ~50K per mile radius
          }
        });
        
        setRealAudienceSize(fallbackReach);
        return;
      }
      
      const data = await response.json();
      console.log('Audience insights response:', data);
      
      if (data.success && data.audience_insights) {
        const facebookUsers = data.audience_insights.estimated_reach.users;
        
        // If Facebook API returned 0 or failed, use fallback calculation
        if (facebookUsers === 0 || data.audience_insights.error) {
          console.log('Facebook API failed or returned 0, using fallback calculation');
          let fallbackReach = 0;
          
          targetingLocations.forEach(location => {
            if (location.type === 'state') {
              fallbackReach += 4000000; // ~4M for Wisconsin
            } else if (location.type === 'county') {
              fallbackReach += 950000; // ~950K for Milwaukee County
            } else if (location.type === 'city') {
              fallbackReach += location.radius * 50000; // ~50K per mile radius
            }
          });
          
          // Adjust for age range
          const ageRange = demographics.maxAge - demographics.minAge;
          fallbackReach = fallbackReach * (ageRange / 40);
          
          setRealAudienceSize(Math.round(fallbackReach));
        } else {
          setRealAudienceSize(facebookUsers);
        }
      }
    } catch (error) {
      console.error('Error fetching audience insights:', error);
    } finally {
      setIsLoadingAudience(false);
    }
  };

  // Fetch real audience size when targeting changes
  useEffect(() => {
    if (currentStep === 4 && connectedAdAccountId && (targetingLocations.length > 0 || automotiveInterests.length > 0)) {
      // Debounce the API call
      const timer = setTimeout(() => {
        fetchRealAudienceSize();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [targetingLocations, automotiveInterests, demographics.minAge, demographics.maxAge, currentStep, connectedAdAccountId]);

  // Calculate estimated reach (fallback)
  const calculateEstimatedReach = () => {
    // Use real audience size if available
    if (realAudienceSize) {
      return realAudienceSize;
    }
    
    // Start at 0 if no targeting selected
    if (targetingLocations.length === 0 && automotiveInterests.length === 0) {
      return 0;
    }
    
    // If we have some targeting but no real data yet, show loading state
    if (targetingLocations.length > 0 || automotiveInterests.length > 0) {
      return 0; // Will be updated when real data arrives
    }
    
    return 0;
  };

  // Handle Facebook campaign launch
  const handleLaunchCampaign = async () => {
    setIsCreatingCampaign(true);
    
    try {
      // Get user's connected ad accounts and pages
      const integrationResponse = await fetch('/api/integrations/social-media');
      const integrationData = await integrationResponse.json();
      
      // Check for connected ad account
      if (!integrationData.connectedAdAccounts || integrationData.connectedAdAccounts.length === 0) {
        alert('Please connect an ad account first. Go to Settings > Integrations > Connect Ad Account.');
        setIsCreatingCampaign(false);
        return;
      }
      
      // Use the first connected ad account
      const adAccountId = integrationData.connectedAdAccounts[0].accountId;
      
      // Check for selected page
      if (!selectedPageId) {
        alert('Please select a Facebook page to use for this campaign.');
        setIsCreatingCampaign(false);
        return;
      }
      
      // Prepare campaign data from wizard
      const campaignData = {
        campaignName: `Single Image VSP Conversions (Ad Wizard)`,
        adSetName: `Default (Ad Wizard)`,
        adName: `Vehicle Title to VSP`,
        lifetimeBudget: parseFloat(budget),
        adAccountId: adAccountId,
        pageId: selectedPageId,
        targeting: {
          locations: targetingLocations,
          interests: automotiveInterests, // Send as array of strings, API will convert to IDs
          demographics: demographics
        },
        headline: headline,
        primaryText: primaryText,
        callToAction: callToAction.toUpperCase().replace(/ /g, '_'),
        destinationUrl: destination === 'vsp' 
          ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ul-cursor.onrender.com'}/autoplexmke/inventory/all/stock/${selectedVehicles[0]?.id || 'vehicle-id'}`
          : `https://m.me/${selectedPageId}`,
        creativeImageUrl: selectedVehicles[0]?.images?.[0] || ''
      };
      
      console.log('Creating campaign with data:', campaignData);
      
      // Create campaign
      const response = await fetch('/api/facebook/create-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCampaignResult(result);
        
        // Show success message
        alert(
          `✅ Campaign Created Successfully!\n\n` +
          `Campaign ID: ${result.campaign.id}\n` +
          `Status: PAUSED (ready for review)\n\n` +
          `Your campaign has been created in Facebook Ads Manager. ` +
          `Review and activate it to start running.\n\n` +
          `Click OK to view in Facebook Ads Manager.`
        );
        
        // Open Facebook Ads Manager
        if (result.facebook_url) {
          window.open(result.facebook_url, '_blank');
        }
      } else {
        console.error('Campaign creation error:', result);
        alert(
          `❌ Failed to Create Campaign\n\n` +
          `Error: ${result.error || 'Unknown error'}\n\n` +
          `Please try again or contact support if the issue persists.`
        );
      }
      
    } catch (error) {
      console.error('Error launching campaign:', error);
      alert(
        `❌ Failed to Launch Campaign\n\n` +
        `An unexpected error occurred. Please try again.\n\n` +
        `If the problem persists, contact support.`
      );
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mt-6">
      <div className="flex items-center justify-between max-w-lg">
        {[1, 2, 3, 4, 5].map((step, index) => (
          <React.Fragment key={step}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              currentStep > step ? 'bg-green-500 text-white' : currentStep === step ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {currentStep > step ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step
              )}
            </div>
            {index < 4 && (
              <div className={`flex-1 h-1 mx-1 ${
                currentStep > step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="mb-8">
      {/* Back Button - Only show when there's somewhere to go back to */}
      {(promotionType || selectedVehicles.length > 0 || selectedSet || showCreateSet) && (
        <div className="mb-4">
          <button 
            onClick={() => {
              if (showCreateSet) {
                // Go back to vehicle set selection
                setShowCreateSet(false);
                setNewSetName('');
                setSelectedVehiclesForSet([]);
                setSetCreationMethod('criteria');
                setFilters([]);
                setFilterLogic('all');
                setSelectedSavedSet('');
                setShowSaveSetOption(false);
              } else if (selectedVehicles.length > 0 || selectedSet) {
                // Go back to promotion type selection
                setSelectedVehicles([]);
                setSelectedSet(null);
                setPromotionType(null);
              } else if (promotionType) {
                // Go back to initial state
                setPromotionType(null);
              }
            }}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {selectedVehicles.length > 0 
            ? 'Ad Created'
            : promotionType === 'set' && showCreateSet ? 'Build Your Collection' : 'Select Vehicle'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {selectedVehicles.length > 0 
            ? selectedVehicles.length === 1
              ? 'Your single image ad is ready'
              : `Your carousel ad will showcase ${selectedVehicles.length} vehicles`
            : promotionType === 'single' 
              ? 'Search and select the specific vehicle you want to promote'
              : promotionType === 'set' && showCreateSet
                ? 'Set filters to automatically include matching vehicles'
                : promotionType === 'set'
                  ? 'Choose from your pre-configured vehicle collections'
                  : 'First, choose how you want to promote your vehicles'
          }
        </p>
      </div>
        
      {/* Promotion Type Selection */}
      {promotionType === null && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button 
              onClick={() => handlePromotionTypeChange('single')}
              className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                promotionType === 'single'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm dark:hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  promotionType === 'single' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${promotionType === 'single' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${
                    promotionType === 'single' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    Single Vehicle
                  </h3>
                  <p className={`text-sm mt-1 ${
                    promotionType === 'single' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Promote one specific vehicle
                  </p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => handlePromotionTypeChange('set')}
              className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                promotionType === 'set'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm dark:hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  promotionType === 'set' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg className={`w-5 h-5 ${promotionType === 'set' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold text-lg ${
                    promotionType === 'set' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    Vehicle Set (Carousel Ad)
                  </h3>
                  <p className={`text-sm mt-1 ${
                    promotionType === 'set' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    Promote a collection of vehicles
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}


      {/* Vehicle Search - Only show when no vehicle is selected */}
        {promotionType === 'single' && selectedVehicles.length === 0 && (
          <div className="mb-6">
            <div className="relative">
              <input 
                type="text" 
              placeholder="Search by year, make, model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          
          {/* Vehicle Count */}
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {vehicles.length > 0 ? (
              <span>
                {debouncedSearchQuery ? (
                  <>
                    {searchFilteredVehicles.length.toLocaleString()} of {vehicles.length.toLocaleString()} vehicles
                  </>
                ) : (
                  <>
                    {vehicles.length.toLocaleString()} vehicles available in catalog
                  </>
                )}
                </span>
            ) : (
              <span>Loading vehicle catalog...</span>
              )}
            </div>
          </div>
        )}

      {/* Vehicle Selection Grid */}
        {promotionType === 'single' && debouncedSearchQuery && selectedVehicles.length === 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Select Vehicle</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {searchFilteredVehicles.map((vehicle) => (
                <div 
                  key={vehicle.id} 
                className="group relative border rounded-lg p-3 cursor-pointer transition-all duration-200 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm dark:hover:shadow-lg"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img 
                          src={vehicle.images[0]} 
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1 line-clamp-1">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
                        {vehicle.bodyStyle} • {vehicle.mileage.value.toLocaleString()} {vehicle.mileage.unit}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          ${vehicle.price.toLocaleString()}
                        </span>
                          {selectedVehicles.some(v => v.id === vehicle.id) && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Vehicle Sets - Only show when no set is selected */}
      {promotionType === 'set' && !selectedSet && (
          <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {showCreateSet ? 'Filter Criteria' : 'Select vehicle collection'}
          </h3>
          
          {/* Existing Sets - Hide when creating custom set */}
          {!showCreateSet && (
            <div className="mb-4">
              <div className="space-y-2">
                {availableSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => handleSetSelect(set)}
                    className="w-full p-4 text-left border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {set.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {set.count} vehicles • {set.description}
                        </p>
              </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
              ))}
            </div>
          </div>
        )}

          {/* Create Custom Set Option - Hide when already creating custom set */}
          {!showCreateSet && (
            <>
              <div className="text-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
              </div>
              
              <button 
                onClick={() => setShowCreateSet(true)}
                className="w-full mt-3 px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Build Custom Collection
                </div>
              </button>
            </>
          )}

          {/* Custom Set Creation */}
          {showCreateSet && (
            <div className="mt-4 p-6 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Set Up Filters</h4>
              
              {/* Set Name and Description */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Set Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g., 'My Luxury Fleet', 'Budget Cars Under $25k'"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Use Saved Set (Optional)</label>
              <select 
                    value={selectedSavedSet}
                onChange={(e) => {
                      setSelectedSavedSet(e.target.value);
                      if (e.target.value) {
                        const savedSet = savedSets.find(set => set.id === e.target.value);
                        if (savedSet) {
                          setFilters(savedSet.filters);
                          setFilterLogic(savedSet.filterLogic);
                        }
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                  >
                    <option value="">Start fresh or select a saved set</option>
                    {savedSets.map((set) => (
                      <option key={set.id} value={set.id}>{set.name}</option>
                ))}
              </select>
          </div>
              </div>

              {/* Creation Method Selection */}
          <div className="mb-6">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">How do you want to create this set?</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setSetCreationMethod('criteria')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      setCreationMethod === 'criteria'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm dark:shadow-blue-900/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm dark:hover:shadow-lg'
                    }`}
                  >
                <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        setCreationMethod === 'criteria' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <svg className={`w-5 h-5 ${setCreationMethod === 'criteria' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          setCreationMethod === 'criteria' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          Use Criteria
                  </h3>
                        <p className={`text-sm mt-1 ${
                          setCreationMethod === 'criteria' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          Filter vehicles by price, year, make, etc.
                        </p>
                </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSetCreationMethod('manual')}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      setCreationMethod === 'manual'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400 shadow-sm dark:shadow-blue-900/20'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm dark:hover:shadow-lg'
                    }`}
                  >
                      <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        setCreationMethod === 'manual' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <svg className={`w-5 h-5 ${setCreationMethod === 'manual' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`font-semibold text-lg ${
                          setCreationMethod === 'manual' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          Select Manually
                        </h3>
                        <p className={`text-sm mt-1 ${
                          setCreationMethod === 'manual' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          Choose specific vehicles one by one
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Advanced Filter Creation */}
              {setCreationMethod === 'criteria' && (
                <div className="space-y-4 mb-6">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Set your criteria</h5>
                  
                  {/* Filter Logic */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicles must match:</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="filterLogic"
                          value="all"
                          checked={filterLogic === 'all'}
                          onChange={(e) => setFilterLogic(e.target.value as 'all' | 'any')}
                          className="w-4 h-4 text-blue-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">all filters</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="filterLogic"
                          value="any"
                          checked={filterLogic === 'any'}
                          onChange={(e) => setFilterLogic(e.target.value as 'all' | 'any')}
                          className="w-4 h-4 text-blue-600 border-gray-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">at least one filter</span>
                      </label>
                    </div>
                  </div>

                  {/* Filters Table */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                      <div className="col-span-3 flex items-center gap-1">
                        Attribute
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        Condition
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="col-span-5 flex items-center gap-1">
                        Value
                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="col-span-1"></div>
                    </div>

                    {filters.map((filter) => (
                      <div key={filter.id} className="grid grid-cols-12 gap-3 items-center">
                        {/* Attribute */}
                        <div className="col-span-3">
                          <div className="relative">
                            <select 
                              value={filter.attribute}
                              onChange={(e) => {
                                const newAttribute = e.target.value;
                                const defaultCondition = getConditionsForAttribute(newAttribute)[0].value;
                                updateFilter(filter.id, 'attribute', newAttribute);
                                updateFilter(filter.id, 'condition', defaultCondition);
                                updateFilter(filter.id, 'value', '');
                              }}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                            >
                              {vehicleAttributes.map(attr => (
                                <option key={attr.value} value={attr.value}>{attr.label}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Condition */}
                        <div className="col-span-3">
                          <div className="relative">
                            <select
                              value={filter.condition}
                              onChange={(e) => updateFilter(filter.id, 'condition', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                            >
                              {getConditionsForAttribute(filter.attribute).map(condition => (
                                <option key={condition.value} value={condition.value}>{condition.label}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="col-span-5">
                          {['make', 'model', 'trim', 'bodyStyle', 'fuelType', 'transmission', 'drivetrain', 'exteriorColor', 'interiorColor', 'condition', 'vehicleType', 'dealerName'].includes(filter.attribute) ? (
                            // Smart value field: dropdown for exact matches, text input for partial matches
                            ['is', 'is_not'].includes(filter.condition) ? (
                              <div className="relative">
                                <select
                                  value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
                                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                                >
                                  <option value="">Select {vehicleAttributes.find(a => a.value === filter.attribute)?.label.toLowerCase()}</option>
                                  {getValueOptionsForAttribute(filter.attribute).map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder={`Add ${vehicleAttributes.find(a => a.value === filter.attribute)?.label.toLowerCase()}`}
                                  value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                                  onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                                  className="w-full px-3 py-2 pl-8 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                                />
                                <svg className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </div>
                            )
                          ) : ['year', 'price', 'mileage'].includes(filter.attribute) ? (
                            <input
                              type="number"
                              placeholder={filter.attribute === 'year' ? '2020' : filter.attribute === 'price' ? '$25000' : '50000'}
                              value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter value"
                              value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
                              onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-gray-200 dark:focus:border-gray-500"
                            />
                          )}
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1">
                          <button
                            onClick={() => removeFilter(filter.id)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                          </button>
                  </div>
                </div>
                    ))}

                    {/* Add Filter Button */}
                    <button
                      onClick={addFilter}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {filters.length === 0 ? 'Add filter' : 'Add another filter'}
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      {filters.length === 0 ? (
                        <>
                          <span className="font-medium">Catalog:</span> {vehicles.length.toLocaleString()} vehicles available
                        </>
                      ) : (
                        <>
                          <span className="font-medium">Preview:</span> {filteredVehicles.length.toLocaleString()} of {vehicles.length.toLocaleString()} vehicles match your filters
                        </>
                      )}
                    </div>
                  </div>

                  {/* Filtered Vehicles Preview */}
                  {filters.length > 0 && filteredVehicles.length > 0 && (
                    <div className="mt-4">
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Matching Vehicles ({filteredVehicles.length})
                      </h6>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                        {filteredVehicles.slice(0, 10).map((vehicle) => (
                          <div key={vehicle.id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img 
                              src={vehicle.images[0]} 
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </div>
                              <div className="text-xs text-gray-500">
                                {vehicle.bodyStyle} • {vehicle.mileage.value.toLocaleString()} {vehicle.mileage.unit} • ${vehicle.price.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredVehicles.length > 10 && (
                          <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                            ... and {filteredVehicles.length - 10} more vehicles
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {filters.length > 0 && filteredVehicles.length === 0 && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm text-red-800">
                        <span className="font-medium">No vehicles match your filters.</span> Try adjusting your criteria.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Manual Selection */}
              {setCreationMethod === 'manual' && (
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select vehicles ({selectedVehiclesForSet.length} selected)
                  </h5>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                    {vehicles.slice(0, 20).map((vehicle) => (
                      <div 
                        key={vehicle.id}
                        onClick={() => handleVehicleToggleForSet(vehicle)}
                        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                          selectedVehiclesForSet.some(v => v.id === vehicle.id) 
                            ? 'bg-blue-50 border-l-4 border-blue-500' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          {vehicle.images && vehicle.images.length > 0 ? (
                            <img 
                              src={vehicle.images[0]} 
                              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          <div className="text-xs text-gray-500">
                            ${vehicle.price.toLocaleString()}
                          </div>
                        </div>
                        {selectedVehiclesForSet.some(v => v.id === vehicle.id) && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                          </div>
                        )}
                        </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save Set Option */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="saveSet"
                      checked={showSaveSetOption}
                      onChange={(e) => setShowSaveSetOption(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="saveSet" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Save this set for future use
                    </label>
                  </div>
                </div>
                
                {/* Save Confirmation */}
                {showSaveConfirmation && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                      <span className="text-sm font-medium text-green-800">
                        Set "{newSetName}" saved successfully!
                            </span>
                          </div>
                  </div>
                )}
                        </div>
                        
              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={setCreationMethod === 'criteria' ? handleCreateSetFromFilters : handleCreateSet}
                  disabled={
                    !newSetName.trim() || 
                    (setCreationMethod === 'criteria' ? 
                      filters.length === 0 || 
                      filters.some(filter => !filter.value || (typeof filter.value === 'string' && !filter.value.trim()))
                      : selectedVehiclesForSet.length === 0
                    )
                  }
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {setCreationMethod === 'criteria' 
                    ? `Create Set (${filteredVehicles.length} vehicles)`
                    : `Create Set (${selectedVehiclesForSet.length} vehicles)`
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Vehicle Card(s) */}
      {selectedVehicles.length > 0 && (
        <div className="mb-6">
          <div className="border border-green-200 dark:border-green-600 rounded-xl p-5 bg-gradient-to-br from-green-50 to-white dark:from-green-900/30 dark:to-gray-800 shadow-lg dark:shadow-green-900/20 hover:shadow-xl dark:hover:shadow-green-900/30 transition-all duration-300">
            {selectedVehicles.length === 1 ? (
              // Single vehicle display
              <div className="flex items-center gap-3">
                <div className="w-20 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md dark:shadow-gray-900/50">
                  {selectedVehicles[0].images && selectedVehicles[0].images.length > 0 ? (
                    <img 
                      src={selectedVehicles[0].images[0]} 
                      alt={`${selectedVehicles[0].year} ${selectedVehicles[0].make} ${selectedVehicles[0].model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                    {selectedVehicles[0].year} {selectedVehicles[0].make} {selectedVehicles[0].model}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {selectedVehicles[0].bodyStyle} • {selectedVehicles[0].mileage.value.toLocaleString()} {selectedVehicles[0].mileage.unit}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${selectedVehicles[0].price.toLocaleString()}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center shadow-md dark:shadow-green-500/30">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                  </div>
                </div>
              </div>
            ) : (
              // Multiple vehicles display (collection)
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md dark:shadow-green-900/30">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                      {selectedSet?.name || 'Vehicle Collection'}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {selectedVehicles.length} vehicles selected
                    </p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-green-500 dark:bg-green-400 flex items-center justify-center shadow-md dark:shadow-green-500/30">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Show all vehicles in the collection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                        {vehicle.images && vehicle.images.length > 0 ? (
                          <img 
                            src={vehicle.images[0]} 
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-3 h-3 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ${vehicle.price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
                </div>
              </div>
            )}

      {/* Continue Button */}
        {(selectedVehicles.length > 0 || selectedSet) && (
        <div className="mt-6">
            <button 
            onClick={() => setCurrentStep(2)}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {selectedVehicles.length > 0 
              ? `Continue with ${selectedVehicles.length} vehicle${selectedVehicles.length === 1 ? '' : 's'} from ${selectedSet?.name || 'selection'}`
              : 'Continue to Choose Destination'
            }
            </button>
          </div>
        )}
    </div>
  );

  const renderStep2 = () => (
    <div className="mb-8">
          <div className="mb-6">
        <button 
          onClick={() => destination ? setDestination('') : goToStep(1)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">{destination ? 'Back to Destination Selection' : 'Back to Step 1'}</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Choose Destination</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Where should customers go when they click your ad?</p>
      </div>

      {!destination ? (
        <div className="space-y-3">
          <button
            onClick={() => setDestination('vsp')}
            className="w-full p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Vehicle Scheduling Page (VSP)</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Drive traffic to your calendar</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => setDestination('messenger')}
            className="w-full p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 bg-white dark:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">Facebook Messenger</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Start conversations from your business page</div>
              </div>
            </div>
          </button>
        </div>
      ) : null}

      {destination && (
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Destination URL</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Where your ad will direct customers</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-600 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Live URL</span>
            </div>
            <code className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 font-mono bg-gray-50 dark:bg-gray-700 px-2 sm:px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-600 block whitespace-nowrap overflow-x-auto">
                  {destination === 'vsp' 
                    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://ul-cursor.onrender.com'}/autoplexmke/inventory/all/stock/${selectedVehicles.length > 0 ? selectedVehicles[0].id : 'vehicle-id'}`
                    : 'facebook.com/messages/t/your-page-id'
                  }
                </code>
              </div>
            </div>
      )}

      {destination && (
        <div className="mt-6">
          <button
            onClick={() => setCurrentStep(3)}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Continue to Budget Settings
          </button>
          </div>
        )}
    </div>
  );

  const renderStep3 = () => (
    <div className="mb-8">
          <div className="mb-6">
        <button 
          onClick={() => goToStep(2)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to Step 2</span>
        </button>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Budget</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Set your lifetime budget and campaign duration</p>
      </div>

      <div className="space-y-6">
              <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Duration</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button 
              onClick={() => {
                if (selectedDuration === '1week') {
                  setSelectedDuration('');
                  setBudget(''); // Clear budget when deselecting
                } else {
                  setSelectedDuration('1week');
                  setBudget(''); // Clear budget when changing duration
                }
                setShowCustomDatePicker(false);
              }}
              className={`p-3 border rounded-lg transition-colors ${
                selectedDuration === '1week' 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md dark:shadow-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">5 Days</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Quick campaign</div>
            </button>
            <button 
              onClick={() => {
                if (selectedDuration === '30days') {
                  setSelectedDuration('');
                  setBudget(''); // Clear budget when deselecting
                } else {
                  setSelectedDuration('30days');
                  setBudget(''); // Clear budget when changing duration
                }
                setShowCustomDatePicker(false);
              }}
              className={`p-3 border rounded-lg transition-colors ${
                selectedDuration === '30days' 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md dark:shadow-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">14 Days</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Standard campaign</div>
            </button>
            <button 
              onClick={() => {
                if (selectedDuration === '3months') {
                  setSelectedDuration('');
                  setBudget(''); // Clear budget when deselecting
                } else {
                  setSelectedDuration('3months');
                  setBudget(''); // Clear budget when changing duration
                }
                setShowCustomDatePicker(false);
              }}
              className={`p-3 border rounded-lg transition-colors ${
                selectedDuration === '3months' 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md dark:shadow-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">30 Days</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Extended campaign</div>
            </button>
          </div>
          
          <div className="mt-4">
            <button 
              onClick={() => {
                if (selectedDuration === 'custom') {
                  setSelectedDuration('');
                  setBudget(''); // Clear budget when deselecting
                  setShowCustomDatePicker(false);
                } else {
                  setSelectedDuration('custom');
                  setBudget(''); // Clear budget when changing duration
                  setShowCustomDatePicker(true);
                }
              }}
              className={`w-full p-3 border rounded-lg transition-colors text-left ${
                selectedDuration === 'custom' 
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 shadow-md dark:shadow-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Custom Duration</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set custom start and end dates (up to 90 days)</div>
            </button>
          </div>

          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Custom Dates</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              {customStartDate && customEndDate && (
                <div className="mt-3 text-xs text-gray-600">
                  Duration: {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lifetime Budget <span className="text-red-500">*</span>
                </label>
                <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
                  <input 
              type="number" 
              placeholder={selectedDuration ? `${selectedDuration === '3months' ? '100' : selectedDuration === '30days' ? '50' : selectedDuration === 'custom' && customStartDate && customEndDate ? Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) * 4 : selectedDuration === 'custom' ? 'Select dates first' : '20'} minimum` : "Select duration first"}
              min={selectedDuration ? (selectedDuration === '3months' ? 100 : selectedDuration === '30days' ? 50 : selectedDuration === 'custom' && customStartDate && customEndDate ? Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) * 4 : 20) : undefined}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              disabled={!selectedDuration}
              className={`w-full pl-8 pr-3 py-3 text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none text-gray-900 dark:text-gray-100 ${
                !selectedDuration ? 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-gray-800'
              }`}
            />
                  </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total amount you want to spend on this campaign</p>
          {budgetError && (
            <p className="text-xs text-red-500 mt-1">{budgetError}</p>
          )}
          {selectedDuration === 'custom' && customStartDate && customEndDate && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Suggested Budget:</span> ${Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) * 10}
                </div>
              <div className="text-xs text-blue-600 mt-1">
                Based on {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24))} days × $10/day
              </div>
            </div>
          )}
        </div>
              </div>

      {/* Continue Button - Only show when all fields are completed and no errors */}
      {budget && selectedDuration && (selectedDuration !== 'custom' || (customStartDate && customEndDate)) && !budgetError && (
        <div className="mt-6">
          <button
            onClick={() => setCurrentStep(4)}
            className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            Continue to Audience Settings
          </button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="mb-8">
      <div className="mb-4 sm:mb-6">
        <button 
          onClick={() => goToStep(3)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to Step 3</span>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Audience Targeting</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Define who sees your ad with precise targeting options</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Location Targeting */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Location Targeting</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Target customers by geographic location</p>
              </div>
            </div>

            {/* Interactive Map */}
            <div className="mb-4">
              <AudienceMap 
                locations={targetingLocations}
                onLocationsChange={(locations) => {
                  setTargetingLocations(locations);
                  // Reset validation attempt flag when user makes a selection
                  setHasAttemptedStep4Continue(false);
                }}
              />
            </div>
            
            {/* Fallback content if map doesn't load */}
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use the search above or quick add buttons to select locations
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Audience Summary & Demographics */}
        <div className="space-y-4 sm:space-y-6">
          {/* Audience Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-600 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">Audience Summary</h3>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Your targeting configuration</p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Reach</span>
                    {isLoadingAudience && (
                      <svg className="animate-spin h-3 w-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {realAudienceSize && !isLoadingAudience && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Live</span>
                    )}
                  </div>
                  <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
                    {calculateEstimatedReach() === 0 && targetingLocations.length === 0 && automotiveInterests.length === 0 ? (
                      <span className="text-gray-400">Select targeting</span>
                    ) : (
                      `~${calculateEstimatedReach().toLocaleString()}`
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 sm:h-2">
                  <div className="bg-blue-600 dark:bg-blue-500 h-1.5 sm:h-2 rounded-full" style={{width: `${calculateEstimatedReach() === 0 ? 0 : Math.min(100, (calculateEstimatedReach() / 1000000) * 100)}%`}}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {targetingLocations.length} location{targetingLocations.length !== 1 ? 's' : ''} • {demographics.minAge}-{demographics.maxAge} age • {automotiveInterests.length} automotive interest{automotiveInterests.length !== 1 ? 's' : ''}
                  {realAudienceSize && !isLoadingAudience && (
                    <span className="text-green-600 dark:text-green-400"> • Facebook data</span>
                  )}
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800 text-center">
                <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{demographics.minAge}-{demographics.maxAge}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Age Range</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Targeting Details</div>
                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  {targetingLocations.map((location, index) => (
                    <div key={location.id} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 
                        index === 2 ? 'bg-purple-500' : 'bg-orange-500'
                      }`}></div>
                      <span>{location.name} ({location.radius} mi)</span>
                    </div>
                  ))}
                  {automotiveInterests.length > 0 ? (
                    automotiveInterests.slice(0, 3).map((interest, index) => (
                      <div key={interest} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          'bg-purple-500'
                        }`}></div>
                        <span>{interest}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-gray-400 dark:text-gray-500">No automotive interests selected</span>
                    </div>
                  )}
                  {automotiveInterests.length > 3 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-500 dark:text-gray-400">+{automotiveInterests.length - 3} more</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Demographics */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Demographics</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Target by age</p>
              </div>
            </div>

            {/* Age Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Age Range</label>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Min Age</label>
                  <select 
                    value={demographics.minAge}
                    onChange={(e) => setDemographics({...demographics, minAge: parseInt(e.target.value)})}
                    className="w-full px-2 sm:px-3 py-2 pr-6 sm:pr-8 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem'
                    }}
                  >
                    <option value="18">18</option>
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="35">35</option>
                    <option value="40">40</option>
                    <option value="45">45</option>
                    <option value="50">50</option>
                    <option value="55">55</option>
                    <option value="60">60</option>
                    <option value="65">65</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Max Age</label>
                  <select 
                    value={demographics.maxAge}
                    onChange={(e) => setDemographics({...demographics, maxAge: parseInt(e.target.value)})}
                    className="w-full px-2 sm:px-3 py-2 pr-6 sm:pr-8 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-0 focus:border-gray-300 dark:focus:border-gray-500 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem'
                    }}
                  >
                    <option value="25">25</option>
                    <option value="30">30</option>
                    <option value="35">35</option>
                    <option value="40">40</option>
                    <option value="45">45</option>
                    <option value="50">50</option>
                    <option value="55">55</option>
                    <option value="60">60</option>
                    <option value="65">65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automotive Interests - Full Width Below */}
      <div className="mt-6 sm:mt-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Automotive Interests</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Target car enthusiasts and buyers</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* Automotive Websites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Automotive Websites</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'AutoTrader.com',
                  'Cars.com', 
                  'CarGurus',
                  'CarMax',
                  'CarFax',
                  'KBB',
                  'Edmunds'
                ].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => {
                      if (automotiveInterests.includes(interest)) {
                        setAutomotiveInterests(automotiveInterests.filter(item => item !== interest));
                      } else {
                        setAutomotiveInterests([...automotiveInterests, interest]);
                      }
                      // Reset validation attempt flag when user makes a selection
                      setHasAttemptedStep4Continue(false);
                    }}
                    className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-full transition-all duration-200 ${
                      automotiveInterests.includes(interest)
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm dark:shadow-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Categories</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Used Cars',
                  'Car Dealerships',
                  'Commercial Vehicles',
                  'Light Commercial'
                ].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => {
                      if (automotiveInterests.includes(interest)) {
                        setAutomotiveInterests(automotiveInterests.filter(item => item !== interest));
                      } else {
                        setAutomotiveInterests([...automotiveInterests, interest]);
                      }
                      // Reset validation attempt flag when user makes a selection
                      setHasAttemptedStep4Continue(false);
                    }}
                    className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-full transition-all duration-200 ${
                      automotiveInterests.includes(interest)
                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 shadow-sm dark:shadow-green-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Types</label>
              <div className="flex flex-wrap gap-2">
                {[
                  'Sedan',
                  'Truck',
                  'SUV',
                  'Coupe',
                  'Convertible',
                  'Hatchback'
                ].map((interest) => (
                  <button
                    key={interest}
                    onClick={() => {
                      if (automotiveInterests.includes(interest)) {
                        setAutomotiveInterests(automotiveInterests.filter(item => item !== interest));
                      } else {
                        setAutomotiveInterests([...automotiveInterests, interest]);
                      }
                      // Reset validation attempt flag when user makes a selection
                      setHasAttemptedStep4Continue(false);
                    }}
                    className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm border rounded-full transition-all duration-200 ${
                      automotiveInterests.includes(interest)
                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm dark:shadow-purple-900/20'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pixel Data Targeting */}
      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Website Visitors</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target people who visited your website</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Pixel Status Check */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pixel Status</span>
                </div>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">Not Connected</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Connect your Facebook Pixel to target website visitors and create custom audiences.
              </p>
              <a 
                href="/integrations" 
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Set up Facebook Pixel Integration
              </a>
            </div>

            {/* Visitor Targeting Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Website Visitors</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'All Website Visitors', days: 'All time', description: 'Anyone who visited your site' },
                  { label: 'Recent Visitors', days: '30 days', description: 'Visitors from last 30 days' },
                  { label: 'Active Visitors', days: '7 days', description: 'Visitors from last week' },
                  { label: 'Hot Prospects', days: '1 day', description: 'Visitors from yesterday' }
                ].map((option) => (
                  <button
                    key={option.label}
                    disabled
                    className="p-4 text-left border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                        <svg className="w-2 h-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{option.description}</div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">
                        {option.days}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Connect your Facebook Pixel to enable website visitor targeting
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {/* Validation Messages - Only show after user attempts to continue */}
        {hasAttemptedStep4Continue && targetingLocations.length === 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Please select at least one location for targeting.
            </p>
          </div>
        )}
        {hasAttemptedStep4Continue && automotiveInterests.length === 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              Please select at least one automotive interest for targeting.
            </p>
          </div>
        )}
        
        {/* Continue Button */}
        <button
          onClick={() => {
            if (targetingLocations.length === 0 || automotiveInterests.length === 0) {
              setHasAttemptedStep4Continue(true);
            } else {
              setCurrentStep(5);
            }
          }}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          Continue to Customize & Preview
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="mb-8">
      <div className="mb-4 sm:mb-6">
        <button
          onClick={() => {
            setHeadline('');
            setPrimaryText('');
            setCallToAction('Shop Now');
            setHasGeneratedAdCopy(false);
            goToStep(4);
          }}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors mb-3"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm">Back to Step 4</span>
        </button>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Customize with Live Preview</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Write your ad content and see it live</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Side - Customization Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Ad Content</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Customize your ad copy and settings</p>
            </div>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Headline <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Enter your ad headline..."
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Text</label>
              <div className="relative">
                <textarea 
                  ref={textareaRef}
                  placeholder="Describe your vehicle or promotion..."
                  value={primaryText}
                  onChange={handlePrimaryTextChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none transition-all duration-200"
                  style={{ minHeight: '80px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-3 top-3 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md p-1.5 transition-colors"
                  title="Add emoji"
                >
                  😀
                </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="mt-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                  <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto">
                    {popularEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md p-1.5 transition-colors"
                        title={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Call to Action</label>
              <select 
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-6 sm:pr-8 text-sm sm:text-base font-normal border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer transition-all duration-200"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1rem'
                }}
              >
                <option value="Shop Now">Shop Now</option>
                <option value="Learn More">Learn More</option>
                <option value="Get Quote">Get Quote</option>
                <option value="Schedule Test Drive">Schedule Test Drive</option>
                <option value="View Details">View Details</option>
              </select>
            </div>

            {/* Facebook Page Selector */}
            {availablePages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Facebook Page <span className="text-red-500">*</span>
                </label>
                <select 
                  value={selectedPageId}
                  onChange={(e) => setSelectedPageId(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-6 sm:pr-8 text-sm sm:text-base font-normal border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer transition-all duration-200"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.75rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1rem'
                  }}
                >
                  {availablePages.map((page) => (
                    <option key={page.pageId} value={page.pageId}>
                      {page.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Your ad will be published from this page
                </p>
              </div>
            )}

            {/* Generate Creative Ad Copy Button */}
            {selectedVehicles.length > 0 && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={generateAdCopy}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm hover:shadow-md"
                >
                  <span>✨</span>
                  <span>Generate Ad Copy</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Live Preview */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Live Preview</h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">See how your ad will appear</p>
            </div>
          </div>
          
          <div className="w-full bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm">
            <VehiclePreview
              key={callToAction}
              promotionType={promotionType}
              selectedVehicles={selectedVehicles}
              selectedSet={selectedSet}
              callToAction={callToAction}
              primaryText={primaryText}
              headline={headline}
            />
          </div>
        </div>
      </div>

      {/* Submit Button - Only show if user has generated ad copy or entered headline */}
      {hasGeneratedAdCopy && (
        <div className="mt-8 flex justify-center">
          <button 
            onClick={handleLaunchCampaign}
            disabled={isCreatingCampaign || !headline || !primaryText}
            className={`px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg text-base ${
              isCreatingCampaign || !headline || !primaryText
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 dark:from-green-500 dark:to-green-600 dark:hover:from-green-600 dark:hover:to-green-700 text-white hover:shadow-xl'
            }`}
          >
            {isCreatingCampaign ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Campaign...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Launch Campaign
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <article className="min-w-0">
      <div className="mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">Ad Wizard</h1>
        <p className="mt-3 text-slate-600 dark:text-gray-300 leading-7 max-w-[70ch]">
          Create professional vehicle ads in 5 simple steps. Select your vehicle, choose your destination, customize your ad, set your budget, and launch your campaign.                                                                                                       
        </p>
    </div>
      <div className="h-px bg-slate-200 dark:bg-gray-700 my-10 lg:my-12" />
      
      {/* Progress Indicator */}
      <div className="mb-8">
        {renderProgressBar()}
        </div>
      
      {/* Render only the current step */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}
      {currentStep === 5 && renderStep5()}
    </article>
  );
};