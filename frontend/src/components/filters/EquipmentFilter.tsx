import { useState, useCallback } from 'react';
import { useLanguage } from '../../i18n';
import { CollapsibleSection } from './CollapsibleSection';

interface EquipmentFilterProps {
  selected: string[];
  onChange: (keywords: string[]) => void;
  onClear: () => void;
}

/** Popular equipment options with Dutch + English keywords */
const EQUIPMENT_PRESETS = [
  { id: 'leather', labelNl: 'Leder interieur', labelEn: 'Leather interior', keywords: ['leder', 'leather', 'leren'] },
  { id: 'panorama', labelNl: 'Panoramadak', labelEn: 'Panoramic roof', keywords: ['panorama', 'panoramic'] },
  { id: 'carbon', labelNl: 'Carbon pakket', labelEn: 'Carbon package', keywords: ['carbon'] },
  { id: 'ceramic', labelNl: 'Keramische remmen', labelEn: 'Ceramic brakes', keywords: ['keramisch', 'ceramic', 'PCCB', 'CCB'] },
  { id: 'hud', labelNl: 'Head-up display', labelEn: 'Head-up display', keywords: ['head-up', 'head up', 'HUD'] },
  { id: 'adaptive_cruise', labelNl: 'Adaptive cruise control', labelEn: 'Adaptive cruise control', keywords: ['adaptive cruise', 'ACC', 'adaptieve cruise'] },
  { id: 'camera_360', labelNl: '360\u00b0 Camera', labelEn: '360\u00b0 Camera', keywords: ['360', 'surround view', 'rondom camera'] },
  { id: 'sport_exhaust', labelNl: 'Sportuitlaat', labelEn: 'Sport exhaust', keywords: ['sportuitlaat', 'sport exhaust', 'akrapovic', 'Akrapovi\u010d'] },
  { id: 'matrix_led', labelNl: 'Matrix LED', labelEn: 'Matrix LED', keywords: ['matrix', 'laser light', 'laserlight'] },
  { id: 'heated_seats', labelNl: 'Stoelverwarming', labelEn: 'Heated seats', keywords: ['stoelverwarming', 'heated seats', 'verwarmde stoelen'] },
  { id: 'ventilated_seats', labelNl: 'Stoelventilatie', labelEn: 'Ventilated seats', keywords: ['stoelventilatie', 'ventilated', 'geventileerde'] },
  { id: 'massage', labelNl: 'Massagestoelen', labelEn: 'Massage seats', keywords: ['massage'] },
  { id: 'soft_close', labelNl: 'Soft-close deuren', labelEn: 'Soft-close doors', keywords: ['soft close', 'soft-close', 'softclose'] },
  { id: 'bo_audio', labelNl: 'Bang & Olufsen audio', labelEn: 'Bang & Olufsen audio', keywords: ['Bang & Olufsen', 'B&O', 'bang olufsen'] },
  { id: 'burmester', labelNl: 'Burmester audio', labelEn: 'Burmester audio', keywords: ['Burmester'] },
  { id: 'harman', labelNl: 'Harman Kardon audio', labelEn: 'Harman Kardon audio', keywords: ['Harman Kardon', 'harman kardon'] },
  { id: 'night_vision', labelNl: 'Night Vision', labelEn: 'Night Vision', keywords: ['night vision', 'nachtzicht'] },
  { id: 'launch_control', labelNl: 'Launch Control', labelEn: 'Launch Control', keywords: ['launch control'] },
  { id: 'sport_seats', labelNl: 'Sportstoelen', labelEn: 'Sport seats', keywords: ['sportstoelen', 'sport seats', 'sportseats', 'kuipstoelen', 'bucket seats'] },
  { id: 'alcantara', labelNl: 'Alcantara', labelEn: 'Alcantara', keywords: ['alcantara'] },
];

export function EquipmentFilter({ selected, onChange, onClear }: EquipmentFilterProps) {
  const { locale } = useLanguage();
  const [customSearch, setCustomSearch] = useState('');

  const togglePreset = useCallback((presetKeywords: string[]) => {
    // Use the first keyword as the filter identifier
    const keyword = presetKeywords[0];
    if (selected.includes(keyword)) {
      onChange(selected.filter(k => k !== keyword));
    } else {
      onChange([...selected, keyword]);
    }
  }, [selected, onChange]);

  const addCustomKeyword = useCallback(() => {
    const trimmed = customSearch.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomSearch('');
    }
  }, [customSearch, selected, onChange]);

  const removeKeyword = useCallback((keyword: string) => {
    onChange(selected.filter(k => k !== keyword));
  }, [selected, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomKeyword();
    }
  }, [addCustomKeyword]);

  return (
    <CollapsibleSection
      title={locale === 'nl' ? 'Opties & Uitrusting' : 'Equipment & Options'}
      activeCount={selected.length}
      onClear={onClear}
      defaultExpanded={selected.length > 0}
    >
      <div className="space-y-3">
        {/* Preset checkboxes */}
        <div className="grid grid-cols-1 gap-1.5">
          {EQUIPMENT_PRESETS.map((preset) => {
            const isActive = selected.some(k => preset.keywords.includes(k));
            return (
              <label
                key={preset.id}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent dark:bg-brand-accent/20'
                    : 'text-surface-600 hover:bg-surface-50 dark:text-surface-400 dark:hover:bg-white/[0.04]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => togglePreset(preset.keywords)}
                  className="h-3.5 w-3.5 rounded border-surface-300 text-brand-accent focus:ring-brand-accent dark:border-surface-600"
                />
                <span className="truncate">
                  {locale === 'nl' ? preset.labelNl : preset.labelEn}
                </span>
              </label>
            );
          })}
        </div>

        {/* Custom keyword search */}
        <div className="pt-2 border-t border-surface-100 dark:border-surface-700/50">
          <p className="text-xs text-surface-400 dark:text-surface-500 mb-1.5">
            {locale === 'nl' ? 'Of zoek op specifieke optie:' : 'Or search for specific option:'}
          </p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customSearch}
              onChange={(e) => setCustomSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={locale === 'nl' ? 'bijv. "keramische remmen"' : 'e.g. "ceramic brakes"'}
              className="flex-1 min-w-0 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-sm placeholder:text-surface-400 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent dark:border-surface-700 dark:bg-white/[0.04] dark:text-surface-200 dark:placeholder:text-surface-500"
            />
            <button
              type="button"
              onClick={addCustomKeyword}
              disabled={!customSearch.trim()}
              className="rounded-lg bg-brand-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Active custom keywords (chips) */}
        {selected.filter(k => !EQUIPMENT_PRESETS.some(p => p.keywords.includes(k))).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selected
              .filter(k => !EQUIPMENT_PRESETS.some(p => p.keywords.includes(k)))
              .map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent dark:bg-brand-accent/20"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-0.5 hover:text-red-500 transition-colors"
                    aria-label={`Remove ${keyword}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
