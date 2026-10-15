import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const origin = 'https://kivach-association-interculturelle.onrender.com'
const pagePaths = {
  home: '/', association: '/association/', presidente: '/presidente/',
  projets: '/projets/', galerie: '/galerie/', contact: '/contact/',
} as const
const titles = {
  fr: ['Accueil', 'L’association', 'Mot de la Présidente', 'Projets', 'Galerie', 'Contact'],
  en: ['Home', 'About the Association', 'A Word from the President', 'Projects', 'Gallery', 'Contact'],
  ru: ['Главная', 'Об ассоциации', 'Слово президента', 'Проекты', 'Галерея', 'Контакты'],
  de: ['Startseite', 'Über den Verein', 'Wort der Präsidentin', 'Projekte', 'Galerie', 'Kontakt'],
  it: ['Home', 'L’associazione', 'La parola della Presidente', 'Progetti', 'Galleria', 'Contatti'],
  ar: ['الرئيسية', 'عن الجمعية', 'كلمة الرئيسة', 'المشاريع', 'معرض الصور', 'اتصل بنا'],
  es: ['Inicio', 'Sobre la asociación', 'Palabras de la presidenta', 'Proyectos', 'Galería', 'Contacto'],
} as const

function localizedPath(path: string, locale: string): string {
  return locale === 'fr' ? path : `/${locale}${path}`
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function seoHead(path: string, locale: string): string {
  const canonical = `${origin}${localizedPath(path, locale)}`
  const alternates = Object.keys(titles).map((code) =>
    `<link rel="alternate" hreflang="${code}" href="${origin}${localizedPath(path, code)}">`
  ).join('')
  return `<link rel="canonical" href="${canonical}">${alternates}<link rel="alternate" hreflang="x-default" href="${origin}${path}">`
}

async function writeLocalizedPages(): Promise<void> {
  const output = resolve(root, 'dist')
  const pageEntries = Object.entries(pagePaths)
  for (const [index, [page, path]] of pageEntries.entries()) {
    const source = resolve(output, page === 'home' ? 'index.html' : `${page}/index.html`)
    const template = await readFile(source, 'utf8')
    for (const [locale, labels] of Object.entries(titles)) {
      const html = template
        .replace(/<html lang="fr">/, `<html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}">`)
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(labels[index])} · Kivach Association Interculturelle</title>`)
        .replace('</head>', `${seoHead(path, locale)}</head>`)
      const destination = resolve(output, localizedPath(path, locale).slice(1), 'index.html')
      await mkdir(resolve(destination, '..'), { recursive: true })
      await writeFile(destination, html)
    }
  }
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${Object.values(pagePaths).flatMap((path) => Object.keys(titles).map((locale) => `<url><loc>${origin}${localizedPath(path, locale)}</loc>${Object.keys(titles).map((code) => `<xhtml:link rel="alternate" hreflang="${code}" href="${origin}${localizedPath(path, code)}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${path}"/></url>`)).join('')}</urlset>`
  await writeFile(resolve(output, 'sitemap.xml'), sitemap)
  await writeFile(resolve(output, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`)
}

export default defineConfig({
  plugins: [{ name: 'localized-static-routes', apply: 'build', closeBundle: writeLocalizedPages }],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        association: resolve(root, 'association/index.html'),
        presidente: resolve(root, 'presidente/index.html'),
        projets: resolve(root, 'projets/index.html'),
        galerie: resolve(root, 'galerie/index.html'),
        contact: resolve(root, 'contact/index.html'),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
})

