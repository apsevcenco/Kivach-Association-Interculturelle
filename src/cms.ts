import { pages, type Page } from './templates'
import { type Locale, type TranslationLocale } from './i18n'
import { russianSeed } from './russianSeed'
import { legalDocuments, type LegalPage } from './legalTemplates'
import { legalUiSeed } from './legalUiSeed'

export type Section = Page | 'global'
export type TextField = { key: string; page: Section; label: string; selector: string; multiline?: boolean }
export type Project = { id: string; category: string; title: string; description: string; imageUrl: string; imageAlt: string }
export type GalleryImage = { id: string; caption: string; imageUrl: string; imageAlt: string }
export type LocalizedCopy = {
  text: Record<string, string>
  projects: Record<string, Pick<Project, 'category' | 'title' | 'description' | 'imageAlt'>>
  gallery: Record<string, Pick<GalleryImage, 'caption' | 'imageAlt'>>
}
export type SiteContent = {
  text: Record<string, string>
  images: Record<string, string>
  projects: Project[]
  gallery: GalleryImage[]
  translations: Record<TranslationLocale, LocalizedCopy>
}

const translationLocales: TranslationLocale[] = ['en', 'ru', 'de', 'it', 'ar', 'es']
function emptyCopy(): LocalizedCopy { return { text: {}, projects: {}, gallery: {} } }

export const sections: { key: Section; label: string }[] = [
  { key: 'global', label: 'Общие элементы' },
  { key: 'home', label: 'Главная' },
  { key: 'about', label: 'Об ассоциации' },
  { key: 'president', label: 'Слово президента' },
  { key: 'projects', label: 'Проекты' },
  { key: 'gallery', label: 'Галерея' },
  { key: 'contact', label: 'Контакты' },
  { key: 'cookies', label: 'Политика cookies' },
  { key: 'privacy', label: 'Конфиденциальность' },
  { key: 'legal', label: 'Mentions légales' },
]

export const textFields: TextField[] = [
  { page: 'global', key: 'global.nav.home', label: 'Меню · Главная', selector: '.site-nav a:nth-child(1)' },
  { page: 'global', key: 'global.nav.about', label: 'Меню · Об ассоциации', selector: '.site-nav a:nth-child(2)' },
  { page: 'global', key: 'global.nav.president', label: 'Меню · Президент', selector: '.site-nav a:nth-child(3)' },
  { page: 'global', key: 'global.nav.projects', label: 'Меню · Проекты', selector: '.site-nav a:nth-child(4)' },
  { page: 'global', key: 'global.nav.gallery', label: 'Меню · Галерея', selector: '.site-nav a:nth-child(5)' },
  { page: 'global', key: 'global.nav.contact', label: 'Меню · Контакты', selector: '.site-nav a:nth-child(6)' },
  { page: 'global', key: 'global.edition', label: 'Надпись в шапке', selector: '.header-edition' },
  { page: 'global', key: 'global.footer.name', label: 'Подвал · название', selector: '.site-footer span:nth-child(1)' },
  { page: 'global', key: 'global.footer.place', label: 'Подвал · место', selector: '.site-footer span:nth-child(3)' },
  { page: 'global', key: 'global.footer.cookies', label: 'Подвал · cookies', selector: '.footer-links a:nth-child(1)' },
  { page: 'global', key: 'global.footer.privacy', label: 'Подвал · конфиденциальность', selector: '.footer-links a:nth-child(2)' },
  { page: 'global', key: 'global.footer.legal', label: 'Подвал · mentions légales', selector: '.footer-links a:nth-child(3)' },
  { page: 'global', key: 'global.footer.manage', label: 'Подвал · управление cookies', selector: '#cookie-settings' },
  { page: 'global', key: 'global.cookie.title', label: 'Баннер · заголовок', selector: '.cookie-notice h2' },
  { page: 'global', key: 'global.cookie.body', label: 'Баннер · текст', selector: '.cookie-notice .cookie-copy', multiline: true },
  { page: 'global', key: 'global.cookie.link', label: 'Баннер · ссылка на политику', selector: '.cookie-notice a' },
  { page: 'global', key: 'global.cookie.button', label: 'Баннер · кнопка', selector: '.cookie-notice button' },
  { page: 'home', key: 'home.kicker', label: 'Надпись над логотипом', selector: '.hero-kicker' },
  { page: 'home', key: 'home.statement', label: 'Главный подзаголовок', selector: '.hero-statement', multiline: true },
  { page: 'home', key: 'home.link', label: 'Ссылка на ассоциацию', selector: '.text-link' },
  { page: 'home', key: 'home.side', label: 'Боковая надпись', selector: '.hero-side', multiline: true },
  { page: 'home', key: 'home.bottom', label: 'Нижняя надпись', selector: '.home-bottom p:first-child' },
  { page: 'about', key: 'about.eyebrow', label: 'Надзаголовок', selector: '.page-heading .eyebrow' },
  { page: 'about', key: 'about.title', label: 'Заголовок', selector: '.page-heading h1' },
  { page: 'about', key: 'about.lead', label: 'Подзаголовок', selector: '.page-heading .lead', multiline: true },
  { page: 'about', key: 'about.section', label: 'Название раздела', selector: '.section-mark' },
  { page: 'about', key: 'about.p1', label: 'Основной текст · абзац 1', selector: '.prose p:nth-child(1)', multiline: true },
  { page: 'about', key: 'about.p2', label: 'Основной текст · абзац 2', selector: '.prose p:nth-child(2)', multiline: true },
  { page: 'about', key: 'about.p3', label: 'Основной текст · абзац 3', selector: '.prose p:nth-child(3)', multiline: true },
  { page: 'about', key: 'about.principle1.title', label: 'Принцип I · заголовок', selector: '.principles > div:nth-child(1) h2' },
  { page: 'about', key: 'about.principle1.text', label: 'Принцип I · текст', selector: '.principles > div:nth-child(1) p', multiline: true },
  { page: 'about', key: 'about.principle2.title', label: 'Принцип II · заголовок', selector: '.principles > div:nth-child(2) h2' },
  { page: 'about', key: 'about.principle2.text', label: 'Принцип II · текст', selector: '.principles > div:nth-child(2) p', multiline: true },
  { page: 'about', key: 'about.principle3.title', label: 'Принцип III · заголовок', selector: '.principles > div:nth-child(3) h2' },
  { page: 'about', key: 'about.principle3.text', label: 'Принцип III · текст', selector: '.principles > div:nth-child(3) p', multiline: true },
  { page: 'about', key: 'about.note', label: 'Примечание', selector: '.source-note', multiline: true },
  { page: 'president', key: 'president.eyebrow', label: 'Надзаголовок', selector: '.page-heading .eyebrow' },
  { page: 'president', key: 'president.title', label: 'Заголовок', selector: '.page-heading h1' },
  { page: 'president', key: 'president.lead', label: 'Подзаголовок', selector: '.page-heading .lead', multiline: true },
  { page: 'president', key: 'president.portraitCaption', label: 'Подпись под портретом', selector: '.portrait-placeholder > p' },
  { page: 'president', key: 'president.salutation', label: 'Обращение', selector: '.letter-salutation' },
  { page: 'president', key: 'president.p1', label: 'Письмо · абзац 1', selector: '.letter p:nth-child(2)', multiline: true },
  { page: 'president', key: 'president.p2', label: 'Письмо · абзац 2', selector: '.letter p:nth-child(3)', multiline: true },
  { page: 'president', key: 'president.p3', label: 'Письмо · абзац 3', selector: '.letter p:nth-child(4)', multiline: true },
  { page: 'president', key: 'president.signature', label: 'Подпись', selector: '.letter .signature' },
  { page: 'president', key: 'president.note', label: 'Примечание', selector: '.letter-caption', multiline: true },
  { page: 'projects', key: 'projects.eyebrow', label: 'Надзаголовок', selector: '.page-heading .eyebrow' },
  { page: 'projects', key: 'projects.title', label: 'Заголовок', selector: '.page-heading h1' },
  { page: 'projects', key: 'projects.lead', label: 'Подзаголовок', selector: '.page-heading .lead', multiline: true },
  { page: 'projects', key: 'projects.note', label: 'Примечание', selector: '.source-note', multiline: true },
  { page: 'gallery', key: 'gallery.eyebrow', label: 'Надзаголовок', selector: '.page-heading .eyebrow' },
  { page: 'gallery', key: 'gallery.title', label: 'Заголовок', selector: '.page-heading h1' },
  { page: 'gallery', key: 'gallery.lead', label: 'Подзаголовок', selector: '.page-heading .lead', multiline: true },
  { page: 'gallery', key: 'gallery.note', label: 'Примечание', selector: '.source-note', multiline: true },
  { page: 'contact', key: 'contact.eyebrow', label: 'Надзаголовок', selector: '.page-heading .eyebrow' },
  { page: 'contact', key: 'contact.title', label: 'Заголовок', selector: '.page-heading h1' },
  { page: 'contact', key: 'contact.lead', label: 'Подзаголовок', selector: '.page-heading .lead', multiline: true },
  { page: 'contact', key: 'contact.locationLabel', label: 'Местонахождение · надпись', selector: '.contact-details .eyebrow' },
  { page: 'contact', key: 'contact.address', label: 'Адрес', selector: '.contact-details address', multiline: true },
  { page: 'contact', key: 'contact.details', label: 'Контактный текст', selector: '.contact-details p:last-child', multiline: true },
  { page: 'contact', key: 'contact.formTitle', label: 'Форма · заголовок', selector: '.contact-form-wrap h2' },
  { page: 'contact', key: 'contact.formIntro', label: 'Форма · пояснение', selector: '.contact-form-wrap > p', multiline: true },
  { page: 'contact', key: 'contact.nameLabel', label: 'Форма · имя', selector: 'label[for="name"]' },
  { page: 'contact', key: 'contact.emailLabel', label: 'Форма · почта', selector: 'label[for="email"]' },
  { page: 'contact', key: 'contact.messageLabel', label: 'Форма · сообщение', selector: 'label[for="message"]' },
  { page: 'contact', key: 'contact.button', label: 'Форма · кнопка', selector: '.contact-form-wrap button[type="submit"]' },
  { page: 'contact', key: 'contact.formNote', label: 'Форма · примечание', selector: '.form-note', multiline: true },
  ...(Object.entries(legalDocuments) as [LegalPage, (typeof legalDocuments)[LegalPage]][]).flatMap(([page, document]): TextField[] => [
    { page, key: `${page}.eyebrow`, label: 'Надзаголовок', selector: `[data-field="${page}.eyebrow"]` },
    { page, key: `${page}.title`, label: 'Заголовок', selector: `[data-field="${page}.title"]` },
    { page, key: `${page}.lead`, label: 'Подзаголовок', selector: `[data-field="${page}.lead"]`, multiline: true },
    ...document.sections.flatMap((section): TextField[] => [
      { page, key: `${page}.${section.id}.heading`, label: `${section.label} · заголовок`, selector: `[data-field="${page}.${section.id}.heading"]` },
      { page, key: `${page}.${section.id}.body`, label: `${section.label} · текст`, selector: `[data-field="${page}.${section.id}.body"]`, multiline: true },
    ]),
  ]),
]

const globalDefaults: Record<string, string> = {
  'global.nav.home': 'Accueil', 'global.nav.about': 'L’association',
  'global.nav.president': 'La Présidente', 'global.nav.projects': 'Projets',
  'global.nav.gallery': 'Galerie', 'global.nav.contact': 'Contact',
  'global.edition': 'Grasse · 2026',
  'global.footer.name': 'Kivach Association Interculturelle',
  'global.footer.place': 'Grasse · France',
  'global.footer.cookies': 'Cookies',
  'global.footer.privacy': 'Confidentialité',
  'global.footer.legal': 'Mentions légales',
  'global.footer.manage': 'Gérer les cookies',
  'global.cookie.title': 'À propos des cookies',
  'global.cookie.body': 'Ce site utilise uniquement un stockage nécessaire à son fonctionnement. Aucun traceur publicitaire ou de mesure d’audience facultative n’est activé.',
  'global.cookie.link': 'Lire la politique des cookies',
  'global.cookie.button': 'J’ai compris',
}

let cachedDefaults: SiteContent | undefined

export function defaultContent(): SiteContent {
  if (cachedDefaults) return structuredClone(cachedDefaults)
  const text = { ...globalDefaults }
  for (const section of sections) {
    if (section.key === 'global') continue
    const doc = new DOMParser().parseFromString(pages[section.key], 'text/html')
    for (const field of textFields.filter((item) => item.page === section.key)) {
      text[field.key] = doc.querySelector(field.selector)?.textContent?.trim() ?? ''
    }
  }
  const projectDoc = new DOMParser().parseFromString(pages.projects, 'text/html')
  const projects: Project[] = Array.from(projectDoc.querySelectorAll('.project-card')).map((card, index) => ({
    id: `original-${index + 1}`,
    category: card.querySelector('.eyebrow')?.textContent?.trim() ?? '',
    title: card.querySelector('h2')?.textContent?.trim() ?? '',
    description: card.querySelector('p:last-child')?.textContent?.trim() ?? '',
    imageUrl: '', imageAlt: '',
  }))
  const galleryDoc = new DOMParser().parseFromString(pages.gallery, 'text/html')
  const gallery: GalleryImage[] = Array.from(galleryDoc.querySelectorAll('.gallery-tile')).map((tile, index) => ({
    id: `original-${index + 1}`,
    caption: tile.querySelector('figcaption')?.firstChild?.textContent?.trim() ?? '',
    imageUrl: '', imageAlt: '',
  }))
  const translations = Object.fromEntries(translationLocales.map((locale) => [locale, emptyCopy()])) as Record<TranslationLocale, LocalizedCopy>
  for (const locale of translationLocales) translations[locale].text = { ...legalUiSeed[locale] }
  translations.ru = structuredClone(russianSeed)
  cachedDefaults = { text, images: { logo: '', portrait: '' }, projects, gallery, translations }
  return structuredClone(cachedDefaults)
}

export function normalizeContent(value: unknown): SiteContent {
  const defaults = defaultContent()
  if (!value || typeof value !== 'object') return defaults
  const raw = value as Partial<SiteContent>
  if (raw.text && typeof raw.text === 'object') {
    for (const key of Object.keys(defaults.text)) {
      if (typeof raw.text[key] === 'string') defaults.text[key] = raw.text[key]
    }
  }
  if (raw.images && typeof raw.images === 'object') {
    for (const key of Object.keys(defaults.images)) {
      if (typeof raw.images[key] === 'string') defaults.images[key] = raw.images[key]
    }
  }
  if (Array.isArray(raw.projects)) defaults.projects = raw.projects.filter(isProject)
  if (Array.isArray(raw.gallery)) defaults.gallery = raw.gallery.filter(isGalleryImage)
  if (raw.translations && typeof raw.translations === 'object') {
    for (const locale of translationLocales) {
      const copy = raw.translations[locale]
      if (!copy || typeof copy !== 'object') continue
      if (copy.text && typeof copy.text === 'object') {
        for (const [key, value] of Object.entries(copy.text)) if (typeof value === 'string') defaults.translations[locale].text[key] = value
      }
      if (copy.projects && typeof copy.projects === 'object') {
        for (const [id, item] of Object.entries(copy.projects)) if (isProjectCopy(item)) defaults.translations[locale].projects[id] = item
      }
      if (copy.gallery && typeof copy.gallery === 'object') {
        for (const [id, item] of Object.entries(copy.gallery)) if (isGalleryCopy(item)) defaults.translations[locale].gallery[id] = item
      }
    }
  }
  return defaults
}

function isProjectCopy(value: unknown): value is LocalizedCopy['projects'][string] {
  return Boolean(value && typeof value === 'object' && ['category', 'title', 'description', 'imageAlt'].every((key) => typeof (value as Record<string, unknown>)[key] === 'string'))
}

function isGalleryCopy(value: unknown): value is LocalizedCopy['gallery'][string] {
  return Boolean(value && typeof value === 'object' && ['caption', 'imageAlt'].every((key) => typeof (value as Record<string, unknown>)[key] === 'string'))
}

export function localizedContent(content: SiteContent, locale: Locale): SiteContent {
  if (locale === 'fr') return content
  const copy = content.translations[locale]
  return {
    ...content,
    text: { ...content.text, ...nonEmpty(copy.text) },
    projects: content.projects.map((item) => ({ ...item, ...nonEmpty(copy.projects[item.id] ?? {}) })),
    gallery: content.gallery.map((item) => ({ ...item, ...nonEmpty(copy.gallery[item.id] ?? {}) })),
  }
}

function nonEmpty<T extends object>(values: T): T {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => typeof value === 'string' && value.trim())) as T
}

function isProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'category', 'title', 'description', 'imageUrl', 'imageAlt'].every((key) => typeof item[key] === 'string')
}

function isGalleryImage(value: unknown): value is GalleryImage {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return ['id', 'caption', 'imageUrl', 'imageAlt'].every((key) => typeof item[key] === 'string')
}

export function safeImageUrl(value: string): string {
  if (!value) return ''
  try {
    const url = new URL(value, window.location.origin)
    return url.protocol === 'https:' || (url.origin === window.location.origin && url.protocol === 'http:') ? url.href : ''
  } catch { return '' }
}

function element(tag: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tag)
  node.className = className
  node.textContent = text
  return node
}

export function applyContent(root: HTMLElement, page: Page, content: SiteContent): void {
  for (const field of textFields) {
    if (field.page !== page && field.page !== 'global') continue
    const node = root.querySelector<HTMLElement>(field.selector)
    if (node && typeof content.text[field.key] === 'string') node.textContent = content.text[field.key]
  }
  const logo = safeImageUrl(content.images.logo ?? '')
  if (logo) root.querySelectorAll<HTMLImageElement>('[data-logo]').forEach((image) => { image.src = logo })
  if (page === 'president') {
    const frame = root.querySelector<HTMLElement>('.portrait-frame')
    const portrait = safeImageUrl(content.images.portrait ?? '')
    if (frame && portrait) {
      frame.replaceChildren()
      const image = document.createElement('img')
      image.src = portrait
      image.alt = content.text['president.portraitCaption'] || 'Portrait de la Présidente'
      image.loading = 'lazy'
      frame.append(image)
    }
  }
  if (page === 'projects') {
    const list = root.querySelector<HTMLElement>('.project-list')
    if (list) {
      list.replaceChildren()
      content.projects.forEach((project, index) => {
        const card = element('article', 'project-card', '')
        card.append(element('span', 'project-number', String(index + 1).padStart(2, '0')))
        const body = document.createElement('div')
        const imageUrl = safeImageUrl(project.imageUrl)
        if (imageUrl) {
          const image = document.createElement('img')
          image.className = 'project-image'
          image.src = imageUrl
          image.alt = project.imageAlt || project.title
          image.loading = 'lazy'
          body.append(image)
        }
        body.append(element('p', 'eyebrow', project.category), element('h2', '', project.title), element('p', 'project-description', project.description))
        card.append(body, element('span', 'project-arrow', '↗'))
        list.append(card)
      })
    }
  }
  if (page === 'gallery') {
    const grid = root.querySelector<HTMLElement>('.gallery-grid')
    if (grid) {
      grid.replaceChildren()
      content.gallery.forEach((item, index) => {
        const figure = element('figure', `gallery-tile tile-${['one', 'two', 'three', 'four'][index % 4]}`, '')
        const art = element('div', 'gallery-art', '')
        const imageUrl = safeImageUrl(item.imageUrl)
        if (imageUrl) {
          const image = document.createElement('img')
          image.src = imageUrl
          image.alt = item.imageAlt || item.caption
          image.loading = 'lazy'
          art.append(image)
        } else art.textContent = ['I', 'II', 'III', 'IV'][index % 4]
        const caption = element('figcaption', '', item.caption)
        caption.append(element('span', '', String(index + 1).padStart(2, '0')))
        figure.append(art, caption)
        grid.append(figure)
      })
    }
  }
}

