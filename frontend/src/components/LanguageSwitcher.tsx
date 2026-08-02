import { useLanguage, type Locale } from '../i18n';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'nl', label: 'NL' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center rounded-lg bg-white/10 backdrop-blur-sm">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-3 py-1.5 text-xs font-semibold transition-all duration-200 first:rounded-l-lg last:rounded-r-lg ${
            locale === lang.code
              ? 'bg-brand-accent text-brand'
              : 'text-surface-300 hover:text-white'
          }`}
          aria-label={`Switch to ${lang.label}`}
          aria-pressed={locale === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
