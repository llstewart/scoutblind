'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingState';

// Common suggestions data
const COMMON_NICHES = [
  'Dentist', 'Plumber', 'HVAC', 'Personal Injury Lawyer', 'Real Estate Agent',
  'Chiropractor', 'Roofer', 'Electrician', 'Auto Repair', 'Landscaper',
  'Plastic Surgeon', 'Wedding Photographer', 'Interior Designer', 'Financial Advisor',
  'Pest Control', 'Locksmith', 'Tree Service', 'Digital Marketing Agency',
  'Gym', 'Yoga Studio', 'Veterinarian', 'Daycare'
];

const COMMON_LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
  'Boston, MA', 'Nashville, TN', 'Baltimore, MD', 'Hagerstown, MD', 'Oklahoma City, OK'
];

interface AutocompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  suggestions: string[];
  disabled?: boolean;
}

function AutocompleteInput({ id, value, onChange, placeholder, label, suggestions, disabled }: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Filter suggestions based on input
    if (value.length > 0 && showSuggestions) {
      const filtered = suggestions.filter(item =>
        item.toLowerCase().includes(value.toLowerCase()) && item.toLowerCase() !== value.toLowerCase()
      ).slice(0, 5); // Limit to 5 suggestions
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, suggestions, showSuggestions]);

  // Handle outside click to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white text-gray-900 border-0 rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary placeholder:text-gray-500 transition-all"
        disabled={disabled}
        autoComplete="off"
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={index}
              className="text-gray-900 cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
              onClick={() => {
                onChange(suggestion);
                setShowSuggestions(false);
              }}
            >
              <span className="block truncate font-medium">{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface SearchFormProps {
  onSearch: (niche: string, location: string) => Promise<void>;
  isLoading: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (niche.trim() && location.trim()) {
      await onSearch(niche.trim(), location.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative z-10">
      <div className="flex flex-col sm:flex-row gap-3">
        <AutocompleteInput
          id="niche"
          value={niche}
          onChange={setNiche}
          placeholder="Business niche (e.g., Dentist, Plumber)"
          label="Business Niche"
          suggestions={COMMON_NICHES}
          disabled={isLoading}
        />
        <AutocompleteInput
          id="location"
          value={location}
          onChange={setLocation}
          placeholder="Location (e.g., Hagerstown, MD)"
          label="Location"
          suggestions={COMMON_LOCATIONS}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !niche.trim() || !location.trim()}
          className="px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-w-[120px]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Running...</span>
            </>
          ) : (
            'Start Analysis'
          )}
        </button>
      </div>
    </form>
  );
}
