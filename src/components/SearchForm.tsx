'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingState';

const STORAGE_KEY_NICHES = 'truesignal_recent_niches';
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

// Supported countries
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'OTHER', name: 'Other', flag: '🌍' },
];

// Canadian Provinces
const CA_PROVINCES = [
  { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland' }, { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' }, { code: 'YT', name: 'Yukon' }
];

// UK Regions
const UK_REGIONS = [
  { code: 'ENG', name: 'England' }, { code: 'SCT', name: 'Scotland' },
  { code: 'WLS', name: 'Wales' }, { code: 'NIR', name: 'Northern Ireland' }
];

// Australian States
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
  } catch {}
}

function clearRecentItems(key: string) {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch {}
}

interface SearchFormProps {
  onSearch: (niche: string, location: string) => Promise<void>;
  isLoading: boolean;
  initialNiche?: string;
  initialLocation?: string;
}

export function SearchForm({ onSearch, isLoading, initialNiche = '', initialLocation = '' }: SearchFormProps) {
  const [niche, setNiche] = useState(initialNiche);
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('US');
  const [freeformLocation, setFreeformLocation] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [recentNiches, setRecentNiches] = useState<string[]>([]);
  const [showNicheSuggestions, setShowNicheSuggestions] = useState(false);
  const [nicheFocused, setNicheFocused] = useState(false);
  const [cityFocused, setCityFocused] = useState(false);

  const countryPickerRef = useRef<HTMLDivElement>(null);
  const nicheInputRef = useRef<HTMLDivElement>(null);

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

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="space-y-3">
        {/* Niche Input */}
        <div ref={nicheInputRef} className="relative">
          <input
            type="text"
            value={niche}
            onChange={(e) => {
              setNiche(e.target.value);
              setShowNicheSuggestions(true);
            }}
            onFocus={() => {
              setShowNicheSuggestions(true);
              setNicheFocused(true);
            }}
            onBlur={() => setNicheFocused(false)}
            placeholder="What type of business?"
            className={`w-full px-5 py-4 text-[15px] bg-zinc-900/50 text-white border rounded-xl placeholder:text-zinc-500 transition-all duration-200 outline-none ${
              nicheFocused
                ? 'border-violet-500/50 bg-zinc-900/80 shadow-lg shadow-violet-500/10'
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
            disabled={isLoading}
            autoComplete="off"
          />

          {/* Recent niches dropdown */}
          {showNicheSuggestions && filteredNiches.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Recent</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearRecentItems(STORAGE_KEY_NICHES);
                    setRecentNiches([]);
                  }}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Clear all
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
                    className="w-full px-4 py-2.5 text-left text-[14px] text-zinc-300 hover:bg-zinc-800/50 hover:text-white flex items-center gap-3 transition-colors"
                  >
                    <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location Row */}
        <div className="flex gap-3">
          {/* Country Picker */}
          <div ref={countryPickerRef} className="relative">
            <button
              type="button"
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className={`h-full px-4 flex items-center gap-2 bg-zinc-900/50 border rounded-xl transition-all duration-200 ${
                showCountryPicker
                  ? 'border-violet-500/50 bg-zinc-900/80'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="text-xl">{selectedCountry?.flag}</span>
              <svg className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${showCountryPicker ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCountryPicker && (
              <div className="absolute left-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 py-2 z-50 max-h-64 overflow-y-auto">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCountry(c.code);
                      setRegion('');
                      setShowCountryPicker(false);
                    }}
                    className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                      country === c.code
                        ? 'bg-violet-500/10 text-violet-400'
                        : 'text-zinc-300 hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{c.flag}</span>
                    <span className="text-[14px]">{c.name}</span>
                    {country === c.code && (
                      <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {country === 'OTHER' ? (
            <input
              type="text"
              value={freeformLocation}
              onChange={(e) => setFreeformLocation(e.target.value)}
              placeholder="City, region, or address"
              className="flex-1 px-5 py-4 text-[15px] bg-zinc-900/50 text-white border border-zinc-800 rounded-xl placeholder:text-zinc-500 transition-all duration-200 outline-none hover:border-zinc-700 focus:border-violet-500/50 focus:bg-zinc-900/80 focus:shadow-lg focus:shadow-violet-500/10"
              disabled={isLoading}
            />
          ) : (
            <>
              {/* City Input */}
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => setCityFocused(true)}
                onBlur={() => setCityFocused(false)}
                placeholder="City"
                className={`flex-1 min-w-0 px-5 py-4 text-[15px] bg-zinc-900/50 text-white border rounded-xl placeholder:text-zinc-500 transition-all duration-200 outline-none ${
                  cityFocused
                    ? 'border-violet-500/50 bg-zinc-900/80 shadow-lg shadow-violet-500/10'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
                disabled={isLoading}
              />

              {/* State/Region Select */}
              <div className="relative min-w-[140px]">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={`w-full h-full px-4 pr-10 text-[15px] bg-zinc-900/50 border border-zinc-800 rounded-xl appearance-none cursor-pointer transition-all duration-200 outline-none hover:border-zinc-700 focus:border-violet-500/50 focus:bg-zinc-900/80 ${
                    region ? 'text-white' : 'text-zinc-500'
                  }`}
                  disabled={isLoading}
                >
                  <option value="" className="bg-zinc-900">{regionPlaceholder}</option>
                  {regions.map((r) => (
                    <option key={r.code} value={r.code} className="bg-zinc-900 text-white">
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full py-4 bg-violet-600 text-white text-[15px] font-medium rounded-xl transition-all duration-200 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-violet-600 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
