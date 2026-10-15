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

export const interfaceCopy: Record<Locale, { skip: string; menu: string; close: string; index: string; home: string; language: string; navigation: string; legal: string; portrait: string }> = {
  fr: { skip: 'Aller au contenu', menu: 'Menu', close: 'Fermer le menu', index: 'Index des sections', home: 'Accueil', language: 'Langue', navigation: 'Navigation principale', legal: 'Informations légales', portrait: 'Portrait à venir' },
  en: { skip: 'Skip to content', menu: 'Menu', close: 'Close menu', index: 'Sections', home: 'Home', language: 'Language', navigation: 'Main navigation', legal: 'Legal information', portrait: 'Portrait coming soon' },
  ru: { skip: 'Перейти к содержимому', menu: 'Меню', close: 'Закрыть меню', index: 'Разделы', home: 'Главная', language: 'Язык', navigation: 'Основное меню', legal: 'Правовая информация', portrait: 'Портрет появится позже' },
  de: { skip: 'Zum Inhalt springen', menu: 'Menü', close: 'Menü schließen', index: 'Rubriken', home: 'Startseite', language: 'Sprache', navigation: 'Hauptnavigation', legal: 'Rechtliche Informationen', portrait: 'Porträt folgt' },
  it: { skip: 'Vai al contenuto', menu: 'Menu', close: 'Chiudi il menu', index: 'Sezioni', home: 'Home', language: 'Lingua', navigation: 'Navigazione principale', legal: 'Informazioni legali', portrait: 'Ritratto in arrivo' },
  ar: { skip: 'انتقل إلى المحتوى', menu: 'القائمة', close: 'إغلاق القائمة', index: 'الأقسام', home: 'الرئيسية', language: 'اللغة', navigation: 'التنقل الرئيسي', legal: 'معلومات قانونية', portrait: 'الصورة قريبًا' },
  es: { skip: 'Saltar al contenido', menu: 'Menú', close: 'Cerrar el menú', index: 'Secciones', home: 'Inicio', language: 'Idioma', navigation: 'Navegación principal', legal: 'Información legal', portrait: 'Retrato próximamente' },
}

export function isLocale(value: string | null): value is Locale {
  return Boolean(value && locales.includes(value as Locale))
}

export function preferredLocale(): Locale {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (isLocale(requested)) {
    window.location.replace(localHref(window.location.pathname + window.location.search + window.location.hash, requested))
    return requested
  }
  const prefix = window.location.pathname.split('/')[1]
  return isLocale(prefix) ? prefix : 'fr'
}

export function localHref(path: string, locale: Locale): string {
  const url = new URL(path, window.location.origin)
  url.searchParams.delete('lang')
  const basePath = url.pathname.replace(/^\/(?:en|ru|de|it|ar|es)(?=\/|$)/, '') || '/'
  const localizedPath = locale === 'fr' ? basePath : `/${locale}${basePath}`
  return localizedPath + url.search + url.hash
}

