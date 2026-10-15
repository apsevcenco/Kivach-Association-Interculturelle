export const locales = ['fr', 'en', 'ru', 'de', 'it', 'ar', 'es'] as const
export type Locale = typeof locales[number]
export type TranslationLocale = Exclude<Locale, 'fr'>

export const languageNames: Record<Locale, string> = {
  fr: 'Français', en: 'English', ru: 'Русский', de: 'Deutsch',
  it: 'Italiano', ar: 'العربية', es: 'Español',
}

export const targetLanguageNames: Record<Locale, string> = {
  fr: 'French', en: 'English', ru: 'Russian', de: 'German',
  it: 'Italian', ar: 'Arabic', es: 'Spanish',
}

export const interfaceCopy: Record<Locale, { skip: string; menu: string; close: string; index: string; home: string; language: string; navigation: string; portrait: string }> = {
  fr: { skip: 'Aller au contenu', menu: 'Menu', close: 'Fermer le menu', index: 'Index des sections', home: 'Accueil', language: 'Langue', navigation: 'Navigation principale', portrait: 'Portrait à venir' },
  en: { skip: 'Skip to content', menu: 'Menu', close: 'Close menu', index: 'Sections', home: 'Home', language: 'Language', navigation: 'Main navigation', portrait: 'Portrait coming soon' },
  ru: { skip: 'Перейти к содержимому', menu: 'Меню', close: 'Закрыть меню', index: 'Разделы', home: 'Главная', language: 'Язык', navigation: 'Основное меню', portrait: 'Портрет появится позже' },
  de: { skip: 'Zum Inhalt springen', menu: 'Menü', close: 'Menü schließen', index: 'Rubriken', home: 'Startseite', language: 'Sprache', navigation: 'Hauptnavigation', portrait: 'Porträt folgt' },
  it: { skip: 'Vai al contenuto', menu: 'Menu', close: 'Chiudi il menu', index: 'Sezioni', home: 'Home', language: 'Lingua', navigation: 'Navigazione principale', portrait: 'Ritratto in arrivo' },
  ar: { skip: 'انتقل إلى المحتوى', menu: 'القائمة', close: 'إغلاق القائمة', index: 'الأقسام', home: 'الرئيسية', language: 'اللغة', navigation: 'التنقل الرئيسي', portrait: 'الصورة قريبًا' },
  es: { skip: 'Saltar al contenido', menu: 'Menú', close: 'Cerrar el menú', index: 'Secciones', home: 'Inicio', language: 'Idioma', navigation: 'Navegación principal', portrait: 'Retrato próximamente' },
}

export function isLocale(value: string | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale))
}

export function preferredLocale(): Locale {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(requested)) {
    try { window.localStorage.setItem('kivach-language', requested) } catch { /* storage can be unavailable */ }
    return requested
  }
  try {
    const stored = window.localStorage.getItem('kivach-language')
    if (isLocale(stored)) return stored
  } catch { /* storage can be unavailable */ }
  return 'fr'
}

export function localHref(path: string, locale: Locale): string {
  if (locale === 'fr') return path
  const url = new URL(path, window.location.origin)
  url.searchParams.set('lang', locale)
  return url.pathname + url.search + url.hash
}
