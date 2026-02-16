'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingState';

const STORAGE_KEY_NICHES = 'scoutblind_recent_niches';
const MAX_RECENT_ITEMS = 8;

// US States
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'DC', name: 'Washington DC' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' }
];

const UK_REGIONS = [
  { code: 'ENG', name: 'England' }, { code: 'SCT', name: 'Scotland' },
  { code: 'WLS', name: 'Wales' }, { code: 'NIR', name: 'Northern Ireland' }
];

const AU_STATES = [
  { code: 'NSW', name: 'New South Wales' }, { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' }, { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' }, { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'ACT' }, { code: 'NT', name: 'Northern Territory' }
];

function getRegionsForCountry(countryCode: string) {
  switch (countryCode) {
    case 'US': return US_STATES;
    case 'CA': return CA_PROVINCES;
    case 'UK': return UK_REGIONS;
    case 'AU': return AU_STATES;
    default: return [];
  }
}

function getRegionPlaceholder(countryCode: string) {
  switch (countryCode) {
    case 'US': return 'State';
    case 'CA': return 'Province';
    case 'UK': return 'Region';
    case 'AU': return 'State';
    default: return 'Region';
  }
}

function getRecentItems(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentItem(key: string, item: string) {
  if (typeof window === 'undefined') return;
  try {
    const items = getRecentItems(key);
    const filtered = items.filter(i => i.toLowerCase() !== item.toLowerCase());
    const updated = [item, ...filtered].slice(0, MAX_RECENT_ITEMS);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch { }
}

function clearRecentItems(key: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch { }
}

interface SearchFormProps {
  onSearch: (niche: string, location: string) => Promise<void>;
  isLoading: boolean;
  initialNiche?: string;
  initialLocation?: string;
  compact?: boolean;
}

export function SearchForm({ onSearch, isLoading, initialNiche = '', initialLocation = '', compact = false }: SearchFormProps) {
  const [niche, setNiche] = useState(initialNiche);
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('US');
  const [freeformLocation, setFreeformLocation] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [recentNiches, setRecentNiches] = useState<string[]>([]);
  const [showNicheSuggestions, setShowNicheSuggestions] = useState(false);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');

  const countryPickerRef = useRef<HTMLDivElement>(null);
  const nicheInputRef = useRef<HTMLDivElement>(null);
  const regionPickerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialLocation) {
      const parts = initialLocation.split(',').map(p => p.trim());
      if (parts.length === 2) {
        setCity(parts[0]);
        setRegion(parts[1]);
      } else {
        setFreeformLocation(initialLocation);
      }
    }
  }, [initialLocation]);

  useEffect(() => {
    setRecentNiches(getRecentItems(STORAGE_KEY_NICHES));
  }, []);

  useEffect(() => {
    if (initialNiche) setNiche(initialNiche);
  }, [initialNiche]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryPickerRef.current && !countryPickerRef.current.contains(event.target as Node)) {
        setShowCountryPicker(false);
      }
      if (regionPickerRef.current && !regionPickerRef.current.contains(event.target as Node)) {
        setShowRegionPicker(false);
      }
      if (nicheInputRef.current && !nicheInputRef.current.contains(event.target as Node)) {
        setShowNicheSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const regions = getRegionsForCountry(country);
  const regionPlaceholder = getRegionPlaceholder(country);
  const selectedCountry = COUNTRIES.find(c => c.code === country);
  const selectedRegion = regions.find(r => r.code === region);

  const getLocationString = () => {
    if (country === 'OTHER') return freeformLocation.trim();
    if (city.trim() && region) return `${city.trim()}, ${region}`;
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const locationString = getLocationString();
    if (niche.trim() && locationString) {
      saveRecentItem(STORAGE_KEY_NICHES, niche.trim());
      setRecentNiches(getRecentItems(STORAGE_KEY_NICHES));
      await onSearch(niche.trim(), locationString);
    }
  };

  const filteredNiches = niche.length > 0
    ? recentNiches.filter(item =>
      item.toLowerCase().includes(niche.toLowerCase()) &&
      item.toLowerCase() !== niche.toLowerCase()
    ).slice(0, 5)
    : recentNiches.slice(0, 5);

  const isFormValid = niche.trim() && (
    country === 'OTHER' ? freeformLocation.trim() : city.trim() && region
  );

  // ============================================
  // COMPACT MODE (for header)
  // ============================================
  if (compact) {
    return (
      <form ref={formRef} onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center gap-3 bg-zinc-900/60 rounded-full px-4 py-2 shadow-lg shadow-black/20">
          {/* Niche Section */}
          <div ref={nicheInputRef} className="relative flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={niche}
              onChange={(e) => {
                setNiche(e.target.value);
                setShowNicheSuggestions(true);
              }}
              onFocus={() => setShowNicheSuggestions(true)}
              placeholder="Business type"
              className="w-20 sm:w-28 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none font-medium"
              disabled={isLoading}
              autoComplete="off"
            />
            {showNicheSuggestions && filteredNiches.length > 0 && (
              <div className="absolute top-full left-0 mt-3 w-48 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 py-1 overflow-hidden">
                {filteredNiches.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setNiche(item);
                      setShowNicheSuggestions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-zinc-700 flex-shrink-0" />

          {/* Location Section */}
          <div className="flex items-center gap-2 min-w-0">
            <svg className="w-4 h-4 text-zinc-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-16 sm:w-24 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none font-medium"
              disabled={isLoading}
            />

            {/* Region Picker */}
            <div ref={regionPickerRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowRegionPicker(!showRegionPicker);
                  setRegionSearch('');
                }}
                className="px-2 py-1 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-md flex items-center gap-1 transition-colors"
                disabled={isLoading}
              >
                <span className={`font-medium leading-none ${!region ? 'text-zinc-500' : 'text-white'}`}>
                  {selectedRegion?.code || regionPlaceholder}
                </span>
                <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showRegionPicker && (
                <div className="absolute top-full right-0 mt-3 w-52 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-zinc-800">
                    <input
                      autoFocus
                      type="text"
                      value={regionSearch}
                      onChange={(e) => setRegionSearch(e.target.value)}
                      placeholder={`Search ${regionPlaceholder.toLowerCase()}...`}
                      className="w-full px-3 py-1.5 text-sm bg-zinc-800 text-zinc-200 rounded-lg outline-none placeholder:text-zinc-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto py-1">
                    {regions
                      .filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()) || r.code.toLowerCase().includes(regionSearch.toLowerCase()))
                      .map((r) => (
                        <button
                          key={r.code}
                          type="button"
                          onClick={() => {
                            setRegion(r.code);
                            setShowRegionPicker(false);
                            setRegionSearch('');
                          }}
                          className={`w-full px-4 py-2 text-left text-sm transition-colors ${region === r.code ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                            }`}
                        >
                          {r.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Country Picker */}
            <div ref={countryPickerRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="px-2 py-1 hover:bg-zinc-800 rounded-md transition-colors flex items-center gap-1"
                title={selectedCountry?.name}
              >
                <span className="text-sm leading-none">{selectedCountry?.flag}</span>
                <svg className="w-3 h-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showCountryPicker && (
                <div className="absolute top-full right-0 mt-3 w-44 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 border-b border-zinc-800">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Country</span>
                  </div>
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCountry(c.code);
                        setRegion('');
                        setShowCountryPicker(false);
                      }}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${country === c.code ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                        }`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                      {country === c.code && (
                        <svg className="w-4 h-4 ml-auto text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`ml-auto px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex items-center gap-1.5 ${isFormValid
              ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/25'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </form>
    );
  }

  // ============================================
  // FULL MODE (for landing page)
  // ============================================
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full max-w-lg mx-auto px-4 sm:px-0">
      <div className="bg-zinc-900/60 rounded-2xl shadow-lg shadow-black/20 p-3 sm:p-6 space-y-3 sm:space-y-4">

        {/* Niche Input */}
        <div ref={nicheInputRef} className="relative">
          <label className="block text-[10px] sm:text-[11px] font-medium text-zinc-500 mb-1 sm:mb-1.5 uppercase tracking-wide">
            Business Type
          </label>
          <input
            type="text"
            value={niche}
            onChange={(e) => {
              setNiche(e.target.value);
              setShowNicheSuggestions(true);
            }}
            onFocus={() => setShowNicheSuggestions(true)}
            placeholder="e.g. Dentist, Plumber, Lawyer"
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/50 rounded-lg text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-violet-500/50 focus:bg-zinc-800 transition-all"
            disabled={isLoading}
            autoComplete="off"
          />

          {showNicheSuggestions && filteredNiches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Recent</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentItems(STORAGE_KEY_NICHES);
                    setRecentNiches([]);
                  }}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400"
                >
                  Clear
                </button>
              </div>
              <div className="py-1">
                {filteredNiches.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      setNiche(item);
                      setShowNicheSuggestions(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location Section */}
        <div>
          <label className="block text-[10px] sm:text-[11px] font-medium text-zinc-500 mb-1 sm:mb-1.5 uppercase tracking-wide">
            Location
          </label>

          {/* Mobile: Stack vertically, Desktop: Grid */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* City Input */}
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-800/50  rounded-lg text-sm sm:text-base text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-violet-500/50 focus:bg-zinc-800 transition-all"
              disabled={isLoading}
            />

            {/* State & Country Row */}
            <div className="flex gap-2">
              {/* Region Picker */}
              <div ref={regionPickerRef} className="relative flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setShowRegionPicker(!showRegionPicker);
                    setRegionSearch('');
                  }}
                  className="w-full sm:w-auto h-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between sm:justify-start gap-2 bg-zinc-800/50  rounded-lg hover:border-zinc-600 transition-colors min-w-[80px]"
                  disabled={isLoading}
                >
                  <span className={`text-sm ${!region ? 'text-zinc-500' : 'text-zinc-100'}`}>
                    {selectedRegion?.code || regionPlaceholder}
                  </span>
                  <svg className={`w-3 h-3 text-zinc-500 transition-transform ${showRegionPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showRegionPicker && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-56 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 overflow-hidden">
                    <div className="px-2 py-2 border-b border-zinc-800">
                      <input
                        autoFocus
                        type="text"
                        value={regionSearch}
                        onChange={(e) => setRegionSearch(e.target.value)}
                        placeholder={`Search ${regionPlaceholder.toLowerCase()}...`}
                        className="w-full px-3 py-2 text-sm bg-zinc-800 text-zinc-200 rounded outline-none placeholder:text-zinc-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                      {regions
                        .filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase()) || r.code.toLowerCase().includes(regionSearch.toLowerCase()))
                        .map((r) => (
                          <button
                            key={r.code}
                            type="button"
                            onClick={() => {
                              setRegion(r.code);
                              setShowRegionPicker(false);
                              setRegionSearch('');
                            }}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors ${region === r.code ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                              }`}
                          >
                            {r.name}
                          </button>
                        ))}
                      {regions.filter(r => r.name.toLowerCase().includes(regionSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-3 text-center text-xs text-zinc-500">
                          No results
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Country Picker */}
              <div ref={countryPickerRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="h-full px-3 py-2.5 sm:py-3 flex items-center gap-1.5 bg-zinc-800/50  rounded-lg hover:border-zinc-600 hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-base">{selectedCountry?.flag}</span>
                  <svg className={`w-3 h-3 text-zinc-400 transition-transform ${showCountryPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showCountryPicker && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-900 rounded-xl shadow-lg shadow-black/30 z-50 py-1">
                    <div className="px-3 py-1.5 border-b border-zinc-800">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Country</span>
                    </div>
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c.code);
                          setRegion('');
                          setShowCountryPicker(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${country === c.code ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                          }`}
                      >
                        <span className="text-base">{c.flag}</span>
                        <span>{c.name}</span>
                        {country === c.code && (
                          <svg className="w-3.5 h-3.5 ml-auto text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Row - Button aligned right on desktop */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all flex items-center justify-center gap-2 ${isFormValid
              ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-500/25'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
