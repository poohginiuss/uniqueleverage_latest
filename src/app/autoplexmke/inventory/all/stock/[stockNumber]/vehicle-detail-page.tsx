'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from '@untitledui/icons';
import VehicleGallery from '@/components/application/vehicle-gallery';
import { Button } from '@/components/base/buttons/button';
import { fetchVehicleData, Vehicle } from '@/lib/vehicle-data';


interface GulfSeaAutoVehicleDetailPageContentProps {
  vehicle: Vehicle;
}

const getTrimLevel = (trim: string) => {
  return trim || '';
};

function GulfSeaAutoVehicleDetailPageContent({ vehicle }: GulfSeaAutoVehicleDetailPageContentProps) {
  const router = useRouter();
  const calendlyRef = useRef<HTMLDivElement>(null);

  // All hooks at the top
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("1:00pm EST");
  const [payment, setPayment] = useState("Cash");
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);

  // Prevent body scroll when modal is open and prevent horizontal scroll on VSP
  useEffect(() => {
    if (showTimeModal || showDateModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Always prevent horizontal scrolling on VSP page
    document.body.style.overflowX = 'hidden';
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.overflowX = 'unset';
    };
  }, [showTimeModal, showDateModal]);


  const stock = vehicle.stockNumber || `UL-${String(vehicle.id).padStart(6, "0")}`;
  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${getTrimLevel(vehicle.trim)}` : ''}`;
  const estMonthly = Math.max(199, Math.round((vehicle.price - 2000) / 47));
  const pretty = (n: number) => n.toLocaleString();

  // Debug logging
  console.log('Vehicle data:', vehicle);
  console.log('Title:', title);
  console.log('Stock:', stock);

  const Icon = ({ path }: { path: string }) => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
    <div className="min-w-0 md:mt-0 -mt-16 md:px-8 lg:px-8 pt-16 pb-8 max-w-4xl mx-auto"> {/* -mt-16 to pull image up to touch header on mobile/tablet, no horizontal padding on mobile, md:px-8 lg:px-8 for tablet/desktop, pt-0 on mobile but pt-16 on desktop, max-w-4xl for better readability */}
      {/* Desktop: Title positioned to match inventory/all headline exactly */}
      <div className="hidden lg:block text-left mb-4 -mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-primary dark:text-gray-100">{title}</h1>
      </div>
      
      {/* Tablet: Title above image */}
      <div className="hidden md:block lg:hidden text-left mb-6 -mt-8">
        <h1 className="text-2xl font-semibold tracking-tight text-primary dark:text-gray-100">{title}</h1>
      </div>

      {/* Gallery */}
      <VehicleGallery images={vehicle.images || []} title={title} stockNumber={stock} />


      {/* Mobile: Floating Card */}
      <div className="md:hidden -mt-4 relative z-10">
        <div className="bg-white dark:bg-gray-950 rounded-t-3xl p-6 mx-4 pb-4">
          {/* Vehicle Title */}
          <div className="mb-6 text-center">
            <h1 className="text-xl font-semibold text-primary dark:text-gray-100 mb-2 leading-tight">{title}</h1>
             <div className="text-tertiary dark:text-gray-400 mb-2 text-sm">
               Located in {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}
          </div>
            <div className="text-tertiary dark:text-gray-400 text-sm mb-2">
              {vehicle.mileage?.value?.toLocaleString() || 'N/A'} miles
        </div>
          </div>

          {/* Mobile: Dealer Info Above Divider */}
          <div className="md:hidden mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary_alt border border-secondary flex items-center justify-center overflow-hidden">
                <img 
                  src="/avatar/nathan.jpeg" 
                  alt="Nathan" 
              className="w-full h-full object-cover"
            />
          </div>
              <div>
                <div className="font-semibold text-primary dark:text-gray-100 text-base">Listed by Nathan</div>
                <div className="text-tertiary dark:text-gray-400 text-sm">Autoplex MKE</div>
        </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-gray-600 mb-6 w-full md:w-1/2" />

          {/* Key Features */}
          <div className="mb-6">
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                <svg className="w-5 h-5 text-fg-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-medium text-primary dark:text-gray-100 text-base">Perfect CARFAX history</div>
                  <div className="text-tertiary dark:text-gray-400 text-sm">No accidents, 1-owner vehicle.</div>
        </div>
      </div>

              <div className="flex items-start gap-4">
                <svg className="w-5 h-5 text-fg-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-medium text-primary dark:text-gray-100 text-base">Schedule test drive</div>
                  <div className="text-tertiary dark:text-gray-400 text-sm">Book your appointment online.</div>
              </div>
              </div>
              
              <div className="flex items-start gap-4">
                <svg className="w-5 h-5 text-fg-secondary mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                <div>
                  <div className="font-medium text-primary dark:text-gray-100 text-base">Available for delivery</div>
                  <div className="text-tertiary dark:text-gray-400 text-sm">Home delivery options available.</div>
                </div>
              </div>
              </div>
            </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-gray-600 mb-6" />

          {/* Vehicle Description */}
          <div className="mb-6">
            <p className="text-tertiary leading-relaxed text-base">
              Welcome to this {vehicle.year} {vehicle.make} {vehicle.model}! This well-maintained vehicle features a {vehicle.fuelType?.toLowerCase() || 'gasoline'} engine, {vehicle.transmission?.toLowerCase() || 'automatic'} transmission, and {vehicle.drivetrain?.toLowerCase() || 'front-wheel drive'} drivetrain. With {vehicle.mileage?.value?.toLocaleString() || 'N/A'} miles and a clean CARFAX history, this vehicle is perfect for your daily commute or weekend adventures. Located in {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}, with easy access to major highways and local amenities...
            </p>
            
            {showMoreDetails && (
              <div className="mt-4">
                <h3 className="font-medium text-primary mb-4 text-base">About this vehicle</h3>
                <div className="space-y-3">
                  
              <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.transmission || 'Automatic'} transmission</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">Exterior color: {vehicle.exteriorColor || 'Unknown'} · Interior color: {vehicle.interiorColor || 'Unknown'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">4/5 overall NHTSA safety rating</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">Fuel type: {vehicle.fuelType || 'Gasoline'}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">25.0 MPG city · 33.0 MPG highway · 28.0 MPG combined</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">This vehicle is paid off</span>
                  </div>
                </div>
              </div>
            )}
            
            <Button 
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              size="md"
              color="secondary"
              className="mt-4 w-full py-3"
            >
              {showMoreDetails ? 'Show less' : 'Show more'}
            </Button>
          </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-gray-600 mb-6" />

          {/* Location */}
                <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">Where you'll be</h2>
            <div className="text-xs text-tertiary dark:text-gray-400 mb-3">
              {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}, United States
                </div>
            <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600 relative">
              {/* Loading placeholder */}
              <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg map-loading-placeholder">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
                </div>
              </div>
              
              {/* Map iframe */}
              <iframe
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-83.04575368400567!3d42.33142737933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8824ca0110cb1d75%3A0x9c445c79d4739b35!2sDetroit%2C%20MI!5e0!3m2!1sen!2sus!4v1625093742000!5m2!1sen!2sus`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="eager"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-lg relative z-10"
                onLoad={() => {
                  // Hide loading placeholder when map loads
                  const placeholder = document.querySelector('.map-loading-placeholder') as HTMLElement;
                  if (placeholder) {
                    placeholder.style.display = 'none';
                  }
                }}
              />
              </div>
            
            {/* Calendar Section - Slim like Airbnb */}
            <div className="max-w-sm mx-auto lg:hidden" style={{display: 'none'}} data-calendar-section>
              <div className="mb-3">
                <h3 className="text-lg font-medium text-slate-900 mb-1">Let's Talk</h3>
                <p className="text-sm text-slate-600">{selectedDate || "Select a date"}</p>
            </div>

              {/* Month header with navigation - edge to edge like Airbnb */}
              <div className="flex items-center justify-between mb-3">
                <button className="p-1 hover:bg-slate-100 rounded">
                  <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-sm font-medium text-slate-900">September 2025</div>
                <button className="p-1 hover:bg-slate-100 rounded">
                  <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
            </div>
              
              <div className="grid grid-cols-7 gap-0 text-center mb-3">
                {/* Days of week - slightly darker like Airbnb */}
                <div className="text-xs text-slate-500 py-2">S</div>
                <div className="text-xs text-slate-500 py-2">M</div>
                <div className="text-xs text-slate-500 py-2">T</div>
                <div className="text-xs text-slate-500 py-2">W</div>
                <div className="text-xs text-slate-500 py-2">T</div>
                <div className="text-xs text-slate-500 py-2">F</div>
                <div className="text-xs text-slate-500 py-2">S</div>
                
                {/* Calendar dates */}
                <div className="text-sm text-slate-300 py-2">25</div>
                <div className="text-sm text-slate-300 py-2">26</div>
                <div className="text-sm text-slate-300 py-2">27</div>
                <div className="text-sm text-slate-300 py-2">28</div>
                <div className="text-sm text-slate-300 py-2">29</div>
                <div className="text-sm text-slate-300 py-2">30</div>
                <div className="text-sm text-slate-300 py-2">31</div>
                
                <div className="text-sm text-slate-300 py-2">1</div>
                <div className="text-sm text-slate-300 py-2">2</div>
                <div className="text-sm text-slate-300 py-2">3</div>
                <div className="text-sm text-slate-300 py-2">4</div>
                <div className="text-sm text-slate-300 py-2">5</div>
                <div className="text-sm text-slate-300 py-2">6</div>
                <div className="text-sm text-slate-300 py-2">7</div>
                
                <div className="text-sm text-slate-300 py-2">8</div>
                <div className="text-sm text-slate-300 py-2">9</div>
                <div className="text-sm text-slate-300 py-2">10</div>
                <div className="text-sm text-slate-300 py-2">11</div>
                <div className="text-sm text-slate-300 py-2">12</div>
                <div className="text-sm text-slate-300 py-2">13</div>
                <div className="text-sm text-slate-300 py-2">14</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 15, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 15, 2025")}>15</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 16, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 16, 2025")}>16</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 17, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 17, 2025")}>17</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 18, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 18, 2025")}>18</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 19, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 19, 2025")}>19</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 20, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 20, 2025")}>20</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 21, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 21, 2025")}>21</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 22, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 22, 2025")}>22</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 23, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 23, 2025")}>23</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 24, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 24, 2025")}>24</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 25, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 25, 2025")}>25</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 26, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 26, 2025")}>26</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 27, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 27, 2025")}>27</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 28, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 28, 2025")}>28</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 29, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 29, 2025")}>29</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 30, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 30, 2025")}>30</div>
                <div className="text-sm text-slate-300 py-2">1</div>
                <div className="text-sm text-slate-300 py-2">2</div>
                <div className="text-sm text-slate-300 py-2">3</div>
                <div className="text-sm text-slate-300 py-2">4</div>
                <div className="text-sm text-slate-300 py-2">5</div>
              </div>
              
              <div 
                className="text-sm text-slate-600 underline cursor-pointer hover:text-slate-800"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedTime("");
                }}
              >
                Clear dates
              </div>
            </div>
            </div>
        </div>
      </div>


      {/* Tablet/Desktop: Same as Mobile Layout */}
      <div className="hidden md:block mt-2 relative z-10">
        <div className="bg-white dark:bg-gray-950 rounded-t-3xl p-6 mx-4 pb-4">
          {/* Location and Mileage */}
          <div className="mb-4 text-left">
             <div className="font-semibold text-primary dark:text-gray-100 mb-1">
               Located in {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}
      </div>
            <div className="text-tertiary dark:text-gray-400 text-sm mb-1">
              {vehicle.mileage?.value?.toLocaleString() || 'N/A'} miles
            </div>
          </div>


          {/* Tablet: Dealer Info Above Divider */}
          <div className="hidden md:block lg:hidden mb-6 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary_alt border border-secondary flex items-center justify-center overflow-hidden">
                <img 
                  src="/avatar/nathan.jpeg" 
                  alt="Nathan" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-primary dark:text-gray-100 text-sm">Listed by Nathan</div>
                <div className="text-tertiary dark:text-gray-400 text-sm">Autoplex MKE</div>
              </div>
            </div>
          </div>

          {/* Desktop: Dealer Info Above Divider */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary_alt border border-secondary flex items-center justify-center overflow-hidden">
                <img 
                  src="/avatar/nathan.jpeg" 
                  alt="Nathan" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-primary dark:text-gray-100 text-sm">Listed by Nathan</div>
                <div className="text-tertiary dark:text-gray-400 text-sm">Autoplex MKE</div>
              </div>
            </div>
          </div>


          {/* Tablet/Desktop: Divider below mileage */}
          <div className="hidden md:block mb-6">
            <div className="w-1/2 border-t border-gray-200"></div>
          </div>

          {/* Desktop/Tablet: Key Features */}
          <div className="hidden md:block mb-6 mt-2">
              <div className="mb-6">
                {/* Key Features */}
                <div className="mt-6 space-y-4">
              <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary_alt border border-secondary flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                <div>
                      <div className="font-semibold text-primary dark:text-gray-100 text-sm">Perfect CARFAX history</div>
                      <div className="text-tertiary dark:text-gray-400 text-sm">No accidents, 1-owner vehicle.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary_alt border border-secondary flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 7h12v9a1 1 0 01-1 1H5a1 1 0 01-1-1V7z" />
                        <path d="M9 9a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      </svg>
                    </div>
                <div>
                      <div className="font-semibold text-primary dark:text-gray-100 text-sm">Schedule test drive</div>
                      <div className="text-tertiary dark:text-gray-400 text-sm">Book your appointment online.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary_alt border border-secondary flex items-center justify-center mt-0.5">
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                <div>
                      <div className="font-semibold text-primary dark:text-gray-100 text-sm">Available for delivery</div>
                      <div className="text-tertiary dark:text-gray-400 text-sm">Home delivery options available.</div>
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Only: Single column layout */}
          <div className="md:hidden mb-6">
            {/* Dealer Info Above Divider */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary_alt border border-secondary flex items-center justify-center overflow-hidden">
                  <img 
                    src="/avatar/nathan.jpeg" 
                    alt="Nathan" 
                className="w-full h-full object-cover"
              />
            </div>
                <div>
                  <div className="font-semibold text-primary dark:text-gray-100 text-sm">Listed by Nathan</div>
                  <div className="text-tertiary dark:text-gray-400 text-sm">Autoplex MKE</div>
          </div>
                </div>
              </div>
            </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-gray-600 mb-6 w-full md:w-1/2" />

          {/* Vehicle Description */}
          <div className="mb-6 md:w-1/2">
            <p className="text-tertiary leading-relaxed text-sm">
              Welcome to this {vehicle.year} {vehicle.make} {vehicle.model}! This well-maintained vehicle features a {vehicle.fuelType?.toLowerCase() || 'gasoline'} engine, {vehicle.transmission?.toLowerCase() || 'automatic'} transmission, and {vehicle.drivetrain?.toLowerCase() || 'front-wheel drive'} drivetrain. With {vehicle.mileage?.value?.toLocaleString() || 'N/A'} miles and a clean CARFAX history, this vehicle is perfect for your daily commute or weekend adventures. Located in {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}, with easy access to major highways and local amenities...
            </p>
            
            {showMoreDetails && (
              <div className="mt-4">
                <h3 className="font-medium text-primary mb-4 text-base">About this vehicle</h3>
                <div className="space-y-3">
                  
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.transmission || 'Automatic'} transmission</span>
            </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.fuelType || 'Gasoline'} Engine</span>
        </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.drivetrain || 'Unknown Drivetrain'}</span>
        </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.interiorColor || 'Unknown'} Interior</span>
              </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-tertiary dark:text-gray-400 text-sm">{vehicle.exteriorColor || 'Unknown'} Exterior</span>
            </div>
            </div>
              </div>
            )}

            <Button 
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              size="sm"
              color="secondary"
              className="mt-4 w-full"
            >
              {showMoreDetails ? 'Show less' : 'Show more'}
            </Button>
          </div>

          {/* Divider */}
          <hr className="border-slate-200 dark:border-gray-600 mb-6" />

          {/* Location */}
              <div>
              <h2 className="text-lg font-medium text-slate-900 dark:text-gray-100 mb-2">Where you'll be</h2>
              <div className="text-xs text-tertiary dark:text-gray-400 mb-3">
                {vehicle.address?.city || 'City'}, {vehicle.address?.region || 'State'}, United States
            </div>
              <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-600 relative">
                {/* Loading placeholder */}
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center rounded-lg map-loading-placeholder-2">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-500 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
                  </div>
                </div>
                
                {/* Map iframe */}
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-83.04575368400567!3d42.33142737933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8824ca0110cb1d75%3A0x9c445c79d4739b35!2sDetroit%2C%20MI!5e0!3m2!1sen!2sus!4v1625093742000!5m2!1sen!2sus`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg relative z-10"
                  onLoad={() => {
                    // Hide loading placeholder when map loads
                    const placeholder = document.querySelector('.map-loading-placeholder-2') as HTMLElement;
                    if (placeholder) {
                      placeholder.style.display = 'none';
                    }
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <hr className="border-slate-200 dark:border-gray-600 my-6" />
            
            {/* Calendar Section - Tablet/Desktop */}
            <div className="max-w-sm mx-auto mt-6 lg:hidden" style={{display: 'none'}}>
              <div className="mb-3">
                <h3 className="text-lg font-medium text-slate-900 mb-1">Let's Talk</h3>
                <p className="text-sm text-slate-600">{selectedDate || "Select a date"}</p>
              </div>
                
              {/* Month header with navigation */}
              <div className="flex items-center justify-between mb-3">
                <button className="p-1 hover:bg-slate-100 rounded">
                  <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
                </button>
                <div className="text-sm font-medium text-slate-900">September 2025</div>
                <button className="p-1 hover:bg-slate-100 rounded">
                  <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
            </div>
                
              <div className="grid grid-cols-7 gap-0 text-center mb-3">
                {/* Days of week */}
                <div className="text-xs text-slate-500 py-2">S</div>
                <div className="text-xs text-slate-500 py-2">M</div>
                <div className="text-xs text-slate-500 py-2">T</div>
                <div className="text-xs text-slate-500 py-2">W</div>
                <div className="text-xs text-slate-500 py-2">T</div>
                <div className="text-xs text-slate-500 py-2">F</div>
                <div className="text-xs text-slate-500 py-2">S</div>
                
                {/* Calendar dates */}
                <div className="text-sm text-slate-300 py-2">25</div>
                <div className="text-sm text-slate-300 py-2">26</div>
                <div className="text-sm text-slate-300 py-2">27</div>
                <div className="text-sm text-slate-300 py-2">28</div>
                <div className="text-sm text-slate-300 py-2">29</div>
                <div className="text-sm text-slate-300 py-2">30</div>
                <div className="text-sm text-slate-300 py-2">31</div>
                
                <div className="text-sm text-slate-300 py-2">1</div>
                <div className="text-sm text-slate-300 py-2">2</div>
                <div className="text-sm text-slate-300 py-2">3</div>
                <div className="text-sm text-slate-300 py-2">4</div>
                <div className="text-sm text-slate-300 py-2">5</div>
                <div className="text-sm text-slate-300 py-2">6</div>
                <div className="text-sm text-slate-300 py-2">7</div>
                
                <div className="text-sm text-slate-300 py-2">8</div>
                <div className="text-sm text-slate-300 py-2">9</div>
                <div className="text-sm text-slate-300 py-2">10</div>
                <div className="text-sm text-slate-300 py-2">11</div>
                <div className="text-sm text-slate-300 py-2">12</div>
                <div className="text-sm text-slate-300 py-2">13</div>
                <div className="text-sm text-slate-300 py-2">14</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 15, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 15, 2025")}>15</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 16, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 16, 2025")}>16</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 17, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 17, 2025")}>17</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 18, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 18, 2025")}>18</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 19, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 19, 2025")}>19</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 20, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 20, 2025")}>20</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 21, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 21, 2025")}>21</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 22, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 22, 2025")}>22</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 23, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 23, 2025")}>23</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 24, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 24, 2025")}>24</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 25, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 25, 2025")}>25</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 26, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 26, 2025")}>26</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 27, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 27, 2025")}>27</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 28, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 28, 2025")}>28</div>
                
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 29, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 29, 2025")}>29</div>
                <div className={`text-sm py-2 hover:bg-slate-100 rounded cursor-pointer ${selectedDate === "Sep 30, 2025" ? "w-12 h-12 flex items-center justify-center rounded-full bg-black text-white" : "text-slate-700"}`} onClick={() => setSelectedDate("Sep 30, 2025")}>30</div>
              </div>
                </div>
        </div>


        </div>




      {/* Mobile: Sticky Bottom CTA Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-[#090717] rounded-t-3xl border-t border-slate-200 dark:border-gray-800">
        <div className="px-6 py-4 pb-safe">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">${pretty(vehicle.price)}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Est. ${estMonthly}/mo</span>
            </div>
            
            <button
              onClick={() => {
                // Open Calendly popup directly
                if (typeof window !== 'undefined' && (window as any).Calendly) {
                  (window as any).Calendly.initPopupWidget({
                    url: 'https://calendly.com/uniqueleverage/scheduler?hide_event_type_details=1&hide_gdpr_banner=1'
                  });
                }
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors duration-200"
            >
              Select Date
            </button>
          </div>
                </div>
            </div>

    </div>
    </div>
  );
}

// Main component that fetches vehicle data
export default function GulfSeaAutoVehicleDetailPage({ stockNumber }: { stockNumber: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        setLoading(true);
        console.log('Loading vehicle data for stock number:', stockNumber);
        
        // Check if user email is in localStorage
        const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') : null;
        console.log('User email from localStorage:', userEmail);
        
        if (!userEmail) {
          // Set a default user email for testing
          if (typeof window !== 'undefined') {
            localStorage.setItem('userEmail', 'nathanallison411@gmail.com');
            console.log('Set default user email in localStorage');
          }
        }
        
        // Use the vehicle-data service to fetch all vehicles
        const vehicles = await fetchVehicleData();
        console.log('Fetched vehicles count:', vehicles.length);
        
        if (vehicles && vehicles.length > 0) {
          // Find the vehicle by stock number
          const foundVehicle = vehicles.find((v: Vehicle) => v.stockNumber === stockNumber);
          console.log('Found vehicle:', foundVehicle ? 'Yes' : 'No');
          
          if (foundVehicle) {
            setVehicle(foundVehicle);
          } else {
            setError(`Vehicle with stock number ${stockNumber} not found`);
          }
        } else {
          setError('No vehicle data available');
        }
      } catch (err) {
        console.error('Error fetching vehicle:', err);
        setError('Failed to load vehicle data');
      } finally {
        setLoading(false);
      }
    };

    if (stockNumber) {
      loadVehicleData();
    }
  }, [stockNumber]);

  if (loading) {
    return (
      <main className="min-w-0 flex-1 bg-secondary_subtle pb-12 shadow-none lg:bg-primary">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading vehicle details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !vehicle) {
    return (
      <main className="min-w-0 flex-1 bg-secondary_subtle pb-12 shadow-none lg:bg-primary">
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vehicle Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || `The vehicle with stock number ${stockNumber} could not be found.`}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <GulfSeaAutoVehicleDetailPageContent vehicle={vehicle} />;
}