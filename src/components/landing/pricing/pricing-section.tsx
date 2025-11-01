import { Fragment } from "react";
 
export const PricingSection = () => {
 
    const coreFeatures = [
        { 
            name: "Multi-user Support", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
            )
        },
        { 
            name: "Location Switching", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
            )
        },
        { 
            name: "Custom Descriptions", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                </svg>
            )
        },
        { 
            name: "Autoposting Options", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"/>
                </svg>
            )
        },
        { 
            name: "Update & Delete", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4a1 1 0 100 2v1a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
            )
        },
        { 
            name: "DMs Integration", 
            icon: (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
                </svg>
            )
        }
    ];

    const includes = [
        "AI-powered ad copy generation for all vehicle types",
        "Native tools integration with VSPs (Vehicle Sales Platforms)",
        "Automated scheduling and posting across multiple platforms",
        "Carousel and single image ad creation",
        "Advanced audience targeting and segmentation",
        "Real-time inventory feed management and sync",
        "Multi-platform publishing (Facebook, Google, Cars.com, etc.)",
        "Lead tracking and attribution analytics",
        "Custom branding and template management",
        "Dedicated onboarding and priority support"
    ];
 
    return (
        <section className="bg-primary py-12 md:py-16 lg:py-24">
            <div className="mx-auto max-w-container px-4 md:px-8">
                <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
                    <h2 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
                        Pricing
                    </h2>
                    <p className="mt-3 text-base text-gray-600 dark:text-gray-300 sm:text-lg md:mt-4">
                        Automotive dealers and marketing teams use Unique Leverage to streamline ad creation, manage inventory feeds, and scale their marketplace presence.
                    </p>
                </div>

                {/* Main Pricing Card */}
                <div className="mt-12 mx-auto max-w-6xl md:mt-16">
                    <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 lg:p-12 shadow-lg">
                        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
                            {/* Left Column - Core Platform */}
                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 md:text-2xl md:mb-4">
                                        The Unique Leverage Software
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed md:text-base">
                                        Everything you need to sell more cars. Automated posting, smart ads, and lead tracking—all in one platform.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    {coreFeatures.map((feature, index) => (
                                        <div key={index} className="flex items-center space-x-2 md:space-x-3">
                                            <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-gray-600 dark:text-gray-400 md:w-6 md:h-6">
                                                {feature.icon}
                                            </div>
                                            <span className="text-xs font-medium text-gray-900 dark:text-white md:text-sm">
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-3 md:pt-4">
                                    <a 
                                        href="/signup"
                                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-sm md:text-base w-full text-center md:w-auto"
                                    >
                                        Get Started for $99
                                    </a>
                                </div>
                            </div>

                            {/* Right Column - Includes */}
                            <div className="space-y-4 md:space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white md:text-xl">
                                    Includes:
                                </h3>
                                
                                <div className="space-y-2 md:space-y-3">
                                    {includes.map((item, index) => (
                                        <div key={index} className="flex items-start space-x-2 md:space-x-3">
                                            <div className="w-4 h-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 md:w-5 md:h-5">
                                                <svg className="w-2.5 h-2.5 text-green-600 dark:text-green-400 md:w-3 md:h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};