import type { TranslationLocale } from './i18n'

// Initial interface copy; every value remains editable in the administration panel.
export const legalUiSeed: Record<TranslationLocale, Record<string, string>> = {
  en: {
    'global.footer.cookies': 'Cookies', 'global.footer.privacy': 'Privacy', 'global.footer.legal': 'Legal notice', 'global.footer.manage': 'About cookies',
    'global.cookie.title': 'About cookies', 'global.cookie.body': 'This site uses only storage necessary for it to work. No advertising or optional analytics trackers are enabled.',
    'global.cookie.link': 'Read the cookie policy', 'global.cookie.button': 'Understood',
  },
  ru: {},
  de: {
    'global.footer.cookies': 'Cookies', 'global.footer.privacy': 'Datenschutz', 'global.footer.legal': 'Impressum', 'global.footer.manage': 'Über Cookies',
    'global.cookie.title': 'Über Cookies', 'global.cookie.body': 'Diese Website verwendet nur Speicherfunktionen, die für ihren Betrieb erforderlich sind. Werbe- oder optionale Analyse-Tracker sind nicht aktiviert.',
    'global.cookie.link': 'Cookie-Richtlinie lesen', 'global.cookie.button': 'Verstanden',
  },
  it: {
    'global.footer.cookies': 'Cookie', 'global.footer.privacy': 'Privacy', 'global.footer.legal': 'Note legali', 'global.footer.manage': 'Informazioni sui cookie',
    'global.cookie.title': 'Informazioni sui cookie', 'global.cookie.body': 'Questo sito utilizza solo la memorizzazione necessaria al suo funzionamento. Non sono attivi tracker pubblicitari o di analisi facoltativa.',
    'global.cookie.link': 'Leggi l’informativa sui cookie', 'global.cookie.button': 'Ho capito',
  },
  ar: {
    'global.footer.cookies': 'ملفات تعريف الارتباط', 'global.footer.privacy': 'الخصوصية', 'global.footer.legal': 'إشعار قانوني', 'global.footer.manage': 'حول ملفات الارتباط',
    'global.cookie.title': 'حول ملفات تعريف الارتباط', 'global.cookie.body': 'يستخدم هذا الموقع التخزين الضروري لتشغيله فقط. ولا تُستخدم أدوات تتبع إعلانية أو أدوات تحليل اختيارية.',
    'global.cookie.link': 'اقرأ سياسة ملفات الارتباط', 'global.cookie.button': 'فهمت',
  },
  es: {
    'global.footer.cookies': 'Cookies', 'global.footer.privacy': 'Privacidad', 'global.footer.legal': 'Aviso legal', 'global.footer.manage': 'Sobre las cookies',
    'global.cookie.title': 'Sobre las cookies', 'global.cookie.body': 'Este sitio utiliza únicamente almacenamiento necesario para su funcionamiento. No se activan rastreadores publicitarios ni de análisis opcionales.',
    'global.cookie.link': 'Leer la política de cookies', 'global.cookie.button': 'Entendido',
  },
}

