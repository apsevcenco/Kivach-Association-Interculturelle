import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { defineConfig } from 'vite'

const root = fileURLToPath(new URL('.', import.meta.url))
const origin = 'https://kivach-association-interculturelle.onrender.com'
const pagePaths = {
  home: '/', association: '/association/', presidente: '/presidente/',
  projets: '/projets/', bunin: '/projets/maison-ivan-bounine/', galerie: '/galerie/', contact: '/contact/',
  cookies: '/cookies/', privacy: '/confidentialite/', legal: '/mentions-legales/',
} as const
const titles = {
  fr: ['Accueil', 'L’association', 'Mot de la Présidente', 'Projets', 'La Maison d’Ivan Bounine', 'Galerie', 'Contact', 'Politique des cookies', 'Politique de confidentialité', 'Mentions légales'],
  en: ['Home', 'About the Association', 'A Word from the President', 'Projects', 'The Ivan Bunin House', 'Gallery', 'Contact', 'Cookie Policy', 'Privacy Policy', 'Legal Notice'],
  ru: ['Главная', 'Об ассоциации', 'Слово президента', 'Проекты', 'Дом Ивана Бунина', 'Галерея', 'Контакты', 'Политика cookies', 'Политика конфиденциальности', 'Правовая информация'],
  de: ['Startseite', 'Über den Verein', 'Wort der Präsidentin', 'Projekte', 'Das Iwan-Bunin-Haus', 'Galerie', 'Kontakt', 'Cookie-Richtlinie', 'Datenschutzerklärung', 'Impressum'],
  it: ['Home', 'L’associazione', 'La parola della Presidente', 'Progetti', 'La Casa di Ivan Bunin', 'Galleria', 'Contatti', 'Informativa sui cookie', 'Informativa sulla privacy', 'Note legali'],
  ar: ['الرئيسية', 'عن الجمعية', 'كلمة الرئيسة', 'المشاريع', 'بيت إيفان بونين', 'معرض الصور', 'اتصل بنا', 'سياسة ملفات تعريف الارتباط', 'سياسة الخصوصية', 'إشعار قانوني'],
  es: ['Inicio', 'Sobre la asociación', 'Palabras de la presidenta', 'Proyectos', 'La Casa de Iván Bunin', 'Galería', 'Contacto', 'Política de cookies', 'Política de privacidad', 'Aviso legal'],
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
  for (const [index, [, path]] of pageEntries.entries()) {
    const source = resolve(output, path.slice(1), 'index.html')
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
        bunin: resolve(root, 'projets/maison-ivan-bounine/index.html'),
        galerie: resolve(root, 'galerie/index.html'),
        contact: resolve(root, 'contact/index.html'),
        cookies: resolve(root, 'cookies/index.html'),
        privacy: resolve(root, 'confidentialite/index.html'),
        legal: resolve(root, 'mentions-legales/index.html'),
        admin: resolve(root, 'admin/index.html'),
      },
    },
  },
})
