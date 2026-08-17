import { useLanguage, type Locale } from '../i18n';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'nl', label: 'NL' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-surface-100/80 backdrop-blur-sm dark:bg-white/[0.06]">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`flex h-11 min-w-[44px] items-center justify-center px-3.5 text-xs font-semibold transition-all duration-200 first:rounded-l-xl last:rounded-r-xl ${
            locale === lang.code
              ? 'bg-accent-gold text-surface-900'
              : 'text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
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
