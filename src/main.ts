import './style.css'
import { logoDataUrl } from './logo'
import { applyContent, defaultContent, localizedContent, normalizeContent } from './cms'
import { supabase } from './supabase'
import { interfaceCopy, languageNames, locales, localHref, preferredLocale } from './i18n'
import { trackPageVisit } from './analytics'

import { pages, type Page } from './templates'

const navigation: Array<{ page: Page; label: string; href: string }> = [
  { page: 'home', label: 'Accueil', href: '/' },
  { page: 'about', label: 'L’association', href: '/association/' },
  { page: 'president', label: 'La Présidente', href: '/presidente/' },
  { page: 'projects', label: 'Projets', href: '/projets/' },
  { page: 'gallery', label: 'Galerie', href: '/galerie/' },
  { page: 'contact', label: 'Contact', href: '/contact/' },
]

const pageName = document.body.dataset.page
const currentPage: Page = pageName && pageName in pages ? pageName as Page : 'home'
const locale = preferredLocale()
const ui = interfaceCopy[locale]
document.documentElement.lang = locale
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) throw new Error('Missing #app element')

const navLinks = navigation.map((item) =>
  '<a href="' + localHref(item.href, locale) + '"' +
  (item.page === currentPage ? ' aria-current="page"' : '') +
  '>' + item.label + '</a>'
).join('')

app.innerHTML =
  '<a class="skip-link" href="#main">' + ui.skip + '</a>' +
  '<header class="site-header">' +
    '<a class="header-logo" href="' + localHref('/', locale) + '" aria-label="Kivach Association Interculturelle, ' + ui.home + '"><img data-logo alt=""></a>' +
    '<button class="menu-toggle" type="button" aria-label="' + ui.menu + '" aria-expanded="false" aria-controls="mobile-menu">' +
      '<span class="menu-toggle-lines" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '<span class="menu-toggle-text" aria-hidden="true">' + ui.menu + '</span>' +
    '</button>' +
    '<nav class="site-nav" id="mobile-menu" aria-label="' + ui.navigation + '">' + navLinks + '</nav>' +
    '<div class="header-tools"><label class="language-label" for="site-language">' + ui.language + '</label><select id="site-language" class="language-select" aria-label="' + ui.language + '">' + locales.map((code) => '<option value="' + code + '"' + (code === locale ? ' selected' : '') + '>' + languageNames[code] + '</option>').join('') + '</select><span class="header-edition">Grasse · 2026</span></div>' +
  '</header>' +
  '<button class="menu-backdrop" type="button" aria-label="' + ui.close + '" tabindex="-1"></button>' +
  pages[currentPage] +
  '<footer class="site-footer"><span>Kivach Association Interculturelle</span><img src="/ornament.svg" alt="" aria-hidden="true"><span>Grasse · France</span>' +
    '<nav class="footer-links" aria-label="' + ui.legal + '"><a href="' + localHref('/cookies/', locale) + '">Cookies</a><a href="' + localHref('/confidentialite/', locale) + '">Confidentialité</a><a href="' + localHref('/mentions-legales/', locale) + '">Mentions légales</a><button id="cookie-settings" type="button">Gérer les cookies</button></nav>' +
  '</footer>' +
  '<aside class="cookie-notice" id="cookie-notice" aria-labelledby="cookie-notice-title" hidden><img src="/ornament.svg" alt="" aria-hidden="true"><div><h2 id="cookie-notice-title">À propos des cookies</h2><p class="cookie-copy">Ce site utilise uniquement un stockage nécessaire à son fonctionnement. Aucun traceur publicitaire ou de mesure d’audience facultative n’est activé.</p></div><div class="cookie-actions"><a href="' + localHref('/cookies/', locale) + '">Lire la politique des cookies</a><button type="button">J’ai compris</button></div></aside>'

document.querySelectorAll<HTMLImageElement>('[data-logo]').forEach((image) => {
  image.src = logoDataUrl
})

if (locale !== 'fr') {
  app.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => {
    link.href = localHref(link.getAttribute('href') || '/', locale)
  })
  const portrait = app.querySelector<HTMLElement>('.portrait-frame span')
  if (portrait) portrait.textContent = ui.portrait
}

function showContent(content: ReturnType<typeof normalizeContent>): void {
  if (!app) return
  const shown = localizedContent(content, locale)
  applyContent(app, currentPage, shown)
  const title = currentPage === 'home' ? shown.text['global.nav.home'] : app.querySelector('main h1')?.textContent
  if (title) document.title = `${title} · Kivach Association Interculturelle`
}

app.style.setProperty('--index-label', `'${ui.index.replaceAll("'", "’")}'`)
if (locale !== 'fr') showContent(defaultContent())
const cookieNotice = app.querySelector<HTMLElement>('#cookie-notice')
const cookieChoiceKey = 'kivach-cookie-notice-v1'
const sixMonths = 183 * 24 * 60 * 60 * 1000
let noticeDismissed = false
try {
  const dismissedAt = Number(window.localStorage.getItem(cookieChoiceKey))
  noticeDismissed = dismissedAt > 0 && Date.now() - dismissedAt < sixMonths
} catch { /* Storage may be unavailable. */ }
if (cookieNotice && !noticeDismissed) cookieNotice.hidden = false
cookieNotice?.querySelector('button')?.addEventListener('click', () => {
  try { window.localStorage.setItem(cookieChoiceKey, String(Date.now())) } catch { /* Storage may be unavailable. */ }
  cookieNotice.hidden = true
})
app.querySelector<HTMLButtonElement>('#cookie-settings')?.addEventListener('click', () => {
  if (!cookieNotice) return
  cookieNotice.hidden = false
  cookieNotice.querySelector<HTMLButtonElement>('button')?.focus()
})
app.querySelector<HTMLSelectElement>('#site-language')?.addEventListener('change', (event) => {
  const selected = (event.currentTarget as HTMLSelectElement).value as typeof locale
  window.location.assign(localHref(window.location.pathname + window.location.search + window.location.hash, selected))
})

if (supabase) {
  void trackPageVisit(supabase, currentPage, locale)
  void supabase.from('site_content').select('content').eq('id', 1).maybeSingle().then(({ data, error }) => {
    if (error) {
      console.warn('Le contenu éditorial est indisponible :', error.message)
      return
    }
    if (data?.content) showContent(normalizeContent(data.content))
  })
}

const menuToggle = document.querySelector<HTMLButtonElement>('.menu-toggle')
const menuBackdrop = document.querySelector<HTMLButtonElement>('.menu-backdrop')
const mobileNav = document.querySelector<HTMLElement>('#mobile-menu')
const mobileMedia = window.matchMedia('(max-width: 700px)')

function setMenuOpen(open: boolean, restoreFocus = false): void {
  const shouldOpen = open && mobileMedia.matches
  document.body.classList.toggle('menu-open', shouldOpen)
  menuToggle?.setAttribute('aria-expanded', String(shouldOpen))
  menuToggle?.setAttribute('aria-label', shouldOpen ? ui.close : ui.menu)
  mobileNav?.toggleAttribute('inert', mobileMedia.matches && !shouldOpen)
  if (shouldOpen) mobileNav?.querySelector<HTMLAnchorElement>('a')?.focus()
  else if (restoreFocus) menuToggle?.focus()
}

setMenuOpen(false)
mobileMedia.addEventListener('change', () => setMenuOpen(false))
menuToggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open')
  setMenuOpen(open, !open)
})
menuBackdrop?.addEventListener('click', () => setMenuOpen(false, true))
mobileNav?.addEventListener('click', (event) => {
  if ((event.target as Element).closest('a')) setMenuOpen(false)
})
document.addEventListener('keydown', (event) => {
  if (!document.body.classList.contains('menu-open')) return
  if (event.key === 'Escape') {
    setMenuOpen(false, true)
    return
  }
  if (event.key !== 'Tab' || !menuToggle || !mobileNav) return
  const links = Array.from(mobileNav.querySelectorAll<HTMLAnchorElement>('a'))
  const last = links.at(-1)
  if (event.shiftKey && document.activeElement === menuToggle && last) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    menuToggle.focus()
  }
})

