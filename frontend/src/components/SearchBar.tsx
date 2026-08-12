import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, SearchResult } from '../api/client';
import { useLanguage } from '../i18n';
import { useOptionalFilterContext } from '../hooks/FilterContext';

interface SearchBarProps {
  /** Called when search results change (including empty query reset) */
  onSearchResults?: (results: SearchResult | null) => void;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

/**
 * Known abbreviation expansions displayed to the user.
 * The actual expansion logic is handled server-side.
 */
const KNOWN_ABBREVIATIONS: Record<string, string> = {
  merc: 'Mercedes-Benz',
  mercedes: 'Mercedes-Benz',
  chevy: 'Chevrolet',
  lambo: 'Lamborghini',
  beemer: 'BMW',
  bimmer: 'BMW',
  vette: 'Corvette',
  aston: 'Aston Martin',
  astonmartin: 'Aston Martin',
  porsche: 'Porsche',
};

export function SearchBar({ onSearchResults }: SearchBarProps) {
  const { t } = useLanguage();

  // Use FilterContext if available (on BrowsePage route), null otherwise
  const filterContext = useOptionalFilterContext();

  const [inputValue, setInputValue] = useState(filterContext?.searchQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(filterContext?.searchQuery ?? '');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the input value
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = inputValue.trim();
      if (trimmed.length >= MIN_QUERY_LENGTH) {
        setDebouncedQuery(trimmed);
      } else {
        setDebouncedQuery('');
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  // Push debounced query to FilterContext
  useEffect(() => {
    if (filterContext) {
      filterContext.setSearchQuery(debouncedQuery);
    }
  }, [debouncedQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only search when we have a valid debounced query (standalone mode without context)
  const isQueryValid = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => api.searchListings({ q: debouncedQuery }),
    enabled: isQueryValid && !filterContext,
    staleTime: 30_000,
  });

  // Notify parent of search results (standalone mode)
  useEffect(() => {
    if (filterContext) return; // context handles it
    if (!isQueryValid) {
      onSearchResults?.(null);
    } else if (data) {
      onSearchResults?.(data);
    }
  }, [data, isQueryValid, onSearchResults, filterContext]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Enforce max length
    if (value.length <= MAX_QUERY_LENGTH) {
      setInputValue(value);
    }
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedQuery('');
    if (filterContext) {
      filterContext.clearSearch();
    }
    onSearchResults?.(null);
  }, [onSearchResults, filterContext]);

  // Check if the current query matches a known abbreviation
  const expandedName = KNOWN_ABBREVIATIONS[debouncedQuery.toLowerCase()];

  const charsRemaining = MAX_QUERY_LENGTH - inputValue.length;
  const showCharWarning = charsRemaining <= 15 && inputValue.length > 0;

  // Use context fetching state if available
  const showSpinner = filterContext
    ? filterContext.isSearching && isQueryValid
    : (isLoading || isFetching) && isQueryValid;

  // Use context search result for no-results display
  const searchResultData = filterContext ? filterContext.searchResult : data;

  return (
    <div className="w-full">
      <div className="relative">
        {/* Search icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <svg
            className="h-5 w-5 text-surface-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={t.searchPlaceholder}
          maxLength={MAX_QUERY_LENGTH}
          className="block w-full rounded-xl border border-surface-200/60 bg-white/10 py-3 pl-12 pr-12 text-sm text-white placeholder-surface-400 shadow-sm backdrop-blur-sm transition-all duration-200 focus:border-brand-accent focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-brand-accent/30 md:bg-white/10 md:text-white md:placeholder-surface-400"
          aria-label="Search cars by make or model"
          role="searchbox"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {showSpinner ? (
            <svg
              className="h-4 w-4 animate-spin text-brand-accent"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : inputValue.length > 0 ? (
            <button
              onClick={handleClear}
              className="rounded-full p-1 text-surface-400 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              aria-label="Clear search"
            >
              <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Hint and status messages */}
      <div className="mt-1.5 min-h-[1.25rem] text-xs">
        {/* Character count warning */}
        {showCharWarning && (
          <span className="text-amber-400">
            {charsRemaining} character{charsRemaining !== 1 ? 's' : ''} remaining
          </span>
        )}

        {/* Minimum characters hint */}
        {inputValue.length > 0 && inputValue.trim().length < MIN_QUERY_LENGTH && !showCharWarning && (
          <span className="text-surface-400">Type at least {MIN_QUERY_LENGTH} characters to search</span>
        )}

        {/* Abbreviation expansion notice */}
        {expandedName && isQueryValid && (
          <span className="text-brand-accent">
            Showing results for: <strong>{expandedName}</strong>
          </span>
        )}
      </div>

      {/* No results message with suggestions */}
      {isQueryValid && searchResultData && searchResultData.totalCount === 0 && !showSpinner && (
        <div className="mt-2 rounded-xl border border-surface-200/20 bg-white/10 p-4 backdrop-blur-sm">
          <p className="text-sm text-surface-300">
            No listings found for &quot;<span className="font-medium text-white">{debouncedQuery}</span>&quot;
          </p>
          {searchResultData.suggestions && searchResultData.suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-surface-400">Try searching for:</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {searchResultData.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInputValue(suggestion);
                      setDebouncedQuery(suggestion);
                    }}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white transition-all hover:bg-brand-accent hover:text-brand"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
