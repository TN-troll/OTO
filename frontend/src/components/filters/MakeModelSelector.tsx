import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useLanguage } from '../../i18n';

/** Logo URL for a car make — uses logo.clearbit.com with fallback domains */
function getMakeLogoUrl(make: string): string {
  const domainMap: Record<string, string> = {
    'Ferrari': 'ferrari.com',
    'Lamborghini': 'lamborghini.com',
    'Porsche': 'porsche.com',
    'McLaren': 'mclaren.com',
    'Bentley': 'bentleymotors.com',
    'Aston Martin': 'astonmartin.com',
    'Mercedes-Benz': 'mercedes-benz.com',
    'BMW': 'bmw.com',
    'Audi': 'audi.com',
    'Maserati': 'maserati.com',
    'Bugatti': 'bugatti.com',
    'Rolls-Royce': 'rolls-roycemotorcars.com',
    'Jaguar': 'jaguarlandrover.com',
    'Lotus': 'lotuscars.com',
    'Alfa Romeo': 'alfaromeo.com',
    'Pagani': 'pagani.com',
    'Koenigsegg': 'koenigsegg.com',
    'Lexus': 'lexus.com',
    'Toyota': 'toyota.com',
    'Nissan': 'nissan.com',
    'Ford': 'ford.com',
    'Chevrolet': 'chevrolet.com',
    'Dodge': 'dodge.com',
    'Volkswagen': 'volkswagen.com',
  };

  const domain = domainMap[make] || `${make.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  return `https://logo.clearbit.com/${domain}?size=40`;
}

interface MakeModelSelectorProps {
  selectedMakes: string[];
  selectedModels: string[];
  onMakesChange: (makes: string[]) => void;
  onModelsChange: (models: string[]) => void;
}

export function MakeModelSelector({
  selectedMakes,
  selectedModels,
  onMakesChange,
  onModelsChange,
}: MakeModelSelectorProps) {
  const { t } = useLanguage();
  const [makeSearch, setMakeSearch] = useState('');
  const [makeDropdownOpen, setMakeDropdownOpen] = useState(false);
  const [makeActiveIndex, setMakeActiveIndex] = useState(-1);
  const [modelSearch, setModelSearch] = useState('');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelActiveIndex, setModelActiveIndex] = useState(-1);
  const makeRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const makeInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const makeListRef = useRef<HTMLDivElement>(null);
  const modelListRef = useRef<HTMLDivElement>(null);

  const makeListboxId = 'make-listbox';
  const modelListboxId = 'model-listbox';

  // Fetch available makes from the API
  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: () => api.getFilterOptions(),
    staleTime: 60_000 * 5,
  });

  // Fetch models for the selected make(s)
  const { data: modelsForMake, isLoading: modelsLoading } = useQuery({
    queryKey: ['modelsForMake', selectedMakes],
    queryFn: () => api.getModelsForMake(selectedMakes),
    enabled: selectedMakes.length > 0,
    staleTime: 60_000 * 5,
  });

  const availableMakes = filterOptions?.makes ?? [];
  const availableModels = modelsForMake ?? [];

  // Filter makes by search
  const filteredMakes = useMemo(() => {
    if (!makeSearch.trim()) return availableMakes;
    const q = makeSearch.toLowerCase();
    return availableMakes.filter((make) => make.toLowerCase().includes(q));
  }, [availableMakes, makeSearch]);

  // Filter models by search
  const filteredModels = useMemo(() => {
    if (!modelSearch.trim()) return availableModels;
    const q = modelSearch.toLowerCase();
    return availableModels.filter((model) => model.toLowerCase().includes(q));
  }, [availableModels, modelSearch]);

  // Reset active index when filtered list changes
  useEffect(() => {
    setMakeActiveIndex(-1);
  }, [filteredMakes.length]);

  useEffect(() => {
    setModelActiveIndex(-1);
  }, [filteredModels.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (makeRef.current && !makeRef.current.contains(e.target as Node)) {
        setMakeDropdownOpen(false);
        setMakeActiveIndex(-1);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
        setModelActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll active option into view
  const scrollIntoView = useCallback((listRef: React.RefObject<HTMLDivElement | null>, index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[role="option"]');
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }, []);

  function toggleMake(make: string) {
    if (selectedMakes.includes(make)) {
      onMakesChange(selectedMakes.filter((m) => m !== make));
    } else {
      onMakesChange([...selectedMakes, make]);
    }
  }

  function toggleModel(model: string) {
    if (selectedModels.includes(model)) {
      onModelsChange(selectedModels.filter((m) => m !== model));
    } else {
      onModelsChange([...selectedModels, model]);
    }
  }

  function removeMake(make: string) {
    onMakesChange(selectedMakes.filter((m) => m !== make));
  }

  function removeModel(model: string) {
    onModelsChange(selectedModels.filter((m) => m !== model));
  }

  function handleMakeKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setMakeDropdownOpen(false);
      setMakeActiveIndex(-1);
      makeInputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!makeDropdownOpen) {
        setMakeDropdownOpen(true);
        setMakeActiveIndex(0);
      } else {
        const next = Math.min(makeActiveIndex + 1, filteredMakes.length - 1);
        setMakeActiveIndex(next);
        scrollIntoView(makeListRef, next);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(makeActiveIndex - 1, 0);
      setMakeActiveIndex(next);
      scrollIntoView(makeListRef, next);
      return;
    }
    if (e.key === 'Enter' && makeActiveIndex >= 0 && makeActiveIndex < filteredMakes.length) {
      e.preventDefault();
      toggleMake(filteredMakes[makeActiveIndex]);
      setMakeSearch('');
      return;
    }
  }

  function handleModelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setModelDropdownOpen(false);
      setModelActiveIndex(-1);
      modelInputRef.current?.blur();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!modelDropdownOpen) {
        setModelDropdownOpen(true);
        setModelActiveIndex(0);
      } else {
        const next = Math.min(modelActiveIndex + 1, filteredModels.length - 1);
        setModelActiveIndex(next);
        scrollIntoView(modelListRef, next);
      }
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.max(modelActiveIndex - 1, 0);
      setModelActiveIndex(next);
      scrollIntoView(modelListRef, next);
      return;
    }
    if (e.key === 'Enter' && modelActiveIndex >= 0 && modelActiveIndex < filteredModels.length) {
      e.preventDefault();
      toggleModel(filteredModels[modelActiveIndex]);
      setModelSearch('');
      return;
    }
  }

  return (
    <div className="space-y-3">
      {/* Make dropdown */}
      <div ref={makeRef} className="relative">
        <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1" id="make-label">
          {t.make}
        </label>

        {/* Selected make tags */}
        {selectedMakes.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selectedMakes.map((make) => (
              <span
                key={make}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-surface-700 dark:text-surface-200"
              >
                <img
                  src={getMakeLogoUrl(make)}
                  alt=""
                  className="h-3.5 w-3.5 rounded-sm object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                {make}
                <button
                  type="button"
                  onClick={() => removeMake(make)}
                  className="ml-0.5 text-primary-400 hover:text-primary-700 dark:text-surface-400 dark:hover:text-white"
                  aria-label={`Remove ${make}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search input / trigger */}
        <div
          className="flex min-h-[44px] items-center rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm transition-colors focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent/30 dark:border-surface-600 dark:bg-surface-700"
        >
          <svg className="mr-2 h-4 w-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={makeInputRef}
            type="text"
            value={makeSearch}
            onChange={(e) => { setMakeSearch(e.target.value); setMakeDropdownOpen(true); }}
            onFocus={() => setMakeDropdownOpen(true)}
            onKeyDown={handleMakeKeyDown}
            placeholder={t.searchPlaceholder?.replace('...', '') || 'Search make...'}
            className="w-full bg-transparent text-base lg:text-sm outline-none placeholder-surface-400 dark:text-white dark:placeholder-surface-500"
            role="combobox"
            aria-expanded={makeDropdownOpen}
            aria-controls={makeListboxId}
            aria-activedescendant={makeActiveIndex >= 0 ? `make-option-${makeActiveIndex}` : undefined}
            aria-labelledby="make-label"
            aria-autocomplete="list"
          />
        </div>

        {/* Dropdown */}
        {makeDropdownOpen && (
          <div
            ref={makeListRef}
            id={makeListboxId}
            role="listbox"
            aria-labelledby="make-label"
            className="absolute z-[100] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-600 dark:bg-surface-800"
          >
            {filteredMakes.length === 0 ? (
              <div className="px-3 py-2 text-xs text-surface-400">No makes found</div>
            ) : (
              filteredMakes.map((make, index) => {
                const isSelected = selectedMakes.includes(make);
                const isActive = index === makeActiveIndex;
                return (
                  <button
                    key={make}
                    id={`make-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { toggleMake(make); setMakeSearch(''); }}
                    onMouseEnter={() => setMakeActiveIndex(index)}
                    className={`flex min-h-[44px] w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? 'bg-surface-100 dark:bg-surface-600'
                        : ''
                    } ${
                      isSelected
                        ? 'bg-primary-50 text-primary-700 dark:bg-surface-700 dark:text-white'
                        : 'text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                    }`}
                  >
                    <img
                      src={getMakeLogoUrl(make)}
                      alt=""
                      className="h-5 w-5 rounded-sm object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span className="flex-1 font-medium">{make}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Model dropdown — only shown when a make is selected */}
      {selectedMakes.length > 0 && (
        <div ref={modelRef} className="relative">
          <label className="block text-xs font-medium text-surface-500 dark:text-surface-400 mb-1" id="model-label">
            Model
          </label>

          {/* Loading skeleton while models load for new make selection */}
          {modelsLoading && selectedModels.length === 0 && (
            <div className="mb-2 space-y-1.5" aria-label="Loading models">
              <div className="h-[44px] animate-pulse rounded-lg bg-surface-100 dark:bg-surface-700" />
            </div>
          )}

          {/* Selected model tags */}
          {selectedModels.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {selectedModels.map((model) => (
                <span
                  key={model}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-200"
                >
                  {model}
                  <button
                    type="button"
                    onClick={() => removeModel(model)}
                    className="ml-0.5 text-surface-400 hover:text-surface-700 dark:text-surface-500 dark:hover:text-white"
                    aria-label={`Remove ${model}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Model search input */}
          <div className="flex min-h-[44px] items-center rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm transition-colors focus-within:border-brand-accent focus-within:ring-1 focus-within:ring-brand-accent/30 dark:border-surface-600 dark:bg-surface-700">
            <svg className="mr-2 h-4 w-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={modelInputRef}
              type="text"
              value={modelSearch}
              onChange={(e) => { setModelSearch(e.target.value); setModelDropdownOpen(true); }}
              onFocus={() => setModelDropdownOpen(true)}
              onKeyDown={handleModelKeyDown}
              placeholder="Search model..."
              className="w-full bg-transparent text-base lg:text-sm outline-none placeholder-surface-400 dark:text-white dark:placeholder-surface-500"
              role="combobox"
              aria-expanded={modelDropdownOpen}
              aria-controls={modelListboxId}
              aria-activedescendant={modelActiveIndex >= 0 ? `model-option-${modelActiveIndex}` : undefined}
              aria-labelledby="model-label"
              aria-autocomplete="list"
            />
          </div>

          {/* Model dropdown */}
          {modelDropdownOpen && (
            <div
              ref={modelListRef}
              id={modelListboxId}
              role="listbox"
              aria-labelledby="model-label"
              className="absolute z-[100] mt-1 max-h-56 w-full overflow-auto rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-600 dark:bg-surface-800"
            >
              {modelsLoading ? (
                <div className="space-y-1 p-2" aria-label="Loading models">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-9 animate-pulse rounded-md bg-surface-100 dark:bg-surface-700"
                    />
                  ))}
                </div>
              ) : filteredModels.length === 0 ? (
                <div className="px-3 py-2 text-xs text-surface-400">No models found</div>
              ) : (
                filteredModels.map((model, index) => {
                  const isSelected = selectedModels.includes(model);
                  const isActive = index === modelActiveIndex;
                  return (
                    <button
                      key={model}
                      id={`model-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { toggleModel(model); setModelSearch(''); }}
                      onMouseEnter={() => setModelActiveIndex(index)}
                      className={`flex min-h-[44px] w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? 'bg-surface-100 dark:bg-surface-600'
                          : ''
                      } ${
                        isSelected
                          ? 'bg-primary-50 text-primary-700 dark:bg-surface-700 dark:text-white'
                          : 'text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
                      }`}
                    >
                      <span className="flex-1 font-medium">{model}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
