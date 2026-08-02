import { useLanguage, type Locale } from '../i18n';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'nl', label: 'NL' },
  { code: 'en', label: 'EN' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div className="flex items-center gap-0.5">
      {LANGUAGES.map((lang, i) => (
        <span key={lang.code} className="flex items-center">
          <button
            onClick={() => setLocale(lang.code)}
            className={`px-1.5 py-0.5 text-xs font-medium transition ${
              locale === lang.code
                ? 'text-white underline underline-offset-2'
                : 'text-white/60 hover:text-white/90'
            }`}
            aria-label={`Switch to ${lang.label}`}
            aria-pressed={locale === lang.code}
          >
            {lang.label}
          </button>
          {i < LANGUAGES.length - 1 && (
            <span className="text-white/30">|</span>
          )}
        </span>
      ))}
    </div>
  );
}
