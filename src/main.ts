import './style.css'
import { logoDataUrl } from './logo'
import { applyContent, normalizeContent } from './cms'
import { supabase } from './supabase'

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
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) throw new Error('Missing #app element')

const navLinks = navigation.map((item) =>
  '<a href="' + item.href + '"' +
  (item.page === currentPage ? ' aria-current="page"' : '') +
  '>' + item.label + '</a>'
).join('')

app.innerHTML =
  '<a class="skip-link" href="#main">Aller au contenu</a>' +
  '<header class="site-header">' +
    '<a class="header-logo" href="/" aria-label="Kivach Association Interculturelle, accueil"><img data-logo alt=""></a>' +
    '<button class="menu-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="mobile-menu">' +
      '<span class="menu-toggle-lines" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '<span class="menu-toggle-text" aria-hidden="true">Menu</span>' +
    '</button>' +
    '<nav class="site-nav" id="mobile-menu" aria-label="Navigation principale">' + navLinks + '</nav>' +
    '<span class="header-edition">Grasse · 2026</span>' +
  '</header>' +
  '<button class="menu-backdrop" type="button" aria-label="Fermer le menu" tabindex="-1"></button>' +
  pages[currentPage] +
  '<footer class="site-footer"><span>Kivach Association Interculturelle</span><img src="/ornament.svg" alt="" aria-hidden="true"><span>Grasse · France</span></footer>'

document.querySelectorAll<HTMLImageElement>('[data-logo]').forEach((image) => {
  image.src = logoDataUrl
})

if (supabase) {
  void supabase.from('site_content').select('content').eq('id', 1).maybeSingle().then(({ data, error }) => {
    if (error) {
      console.warn('Le contenu éditorial est indisponible :', error.message)
      return
    }
    if (data?.content && app) applyContent(app, currentPage, normalizeContent(data.content))
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
  menuToggle?.setAttribute('aria-label', shouldOpen ? 'Fermer le menu' : 'Ouvrir le menu')
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
