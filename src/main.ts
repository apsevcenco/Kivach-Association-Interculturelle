import './style.css'
import { logoDataUrl } from './logo'

type Page = 'home' | 'about' | 'president' | 'projects' | 'gallery' | 'contact'

const navigation: Array<{ page: Page; label: string; href: string }> = [
  { page: 'home', label: 'Accueil', href: '/' },
  { page: 'about', label: 'L’association', href: '/association/' },
  { page: 'president', label: 'La Présidente', href: '/presidente/' },
  { page: 'projects', label: 'Projets', href: '/projets/' },
  { page: 'gallery', label: 'Galerie', href: '/galerie/' },
  { page: 'contact', label: 'Contact', href: '/contact/' },
]

const pages: Record<Page, string> = {
  home: "<main id=\"main\"><section class=\"hero\"><div class=\"hero-inner\"><p class=\"hero-kicker\">Grasse · France &nbsp;—&nbsp; Association loi 1901</p><img class=\"hero-logo\" data-logo alt=\"Kivach Association Interculturelle\"><div class=\"hero-rule\"></div><p class=\"hero-statement\">Favoriser les échanges interculturels, le lien social et la rencontre des cultures.</p><a class=\"text-link\" href=\"/association/\">Découvrir l’association <span aria-hidden=\"true\">↗</span></a></div><div class=\"hero-side\">Une maison ouverte aux cultures du monde<br>et aux voix qui les font vivre.</div></section><section class=\"home-bottom\"><p>Culture <span>·</span> Musique <span>·</span> Rencontre</p><p>01 / 06</p></section></main>",
  about: "<main id=\"main\" class=\"inner-page\"><section class=\"page-heading\"><p class=\"eyebrow\">I · Kivach Association Interculturelle</p><h1>L’association</h1><p class=\"lead\">Une association née du désir de rapprocher les personnes par la culture, la musique et le dialogue.</p><img class=\"ornament\" src=\"/ornament.svg\" alt=\"\" aria-hidden=\"true\"></section><section class=\"editorial-grid\"><div class=\"section-mark\">Notre raison d’être</div><div class=\"prose\"><p class=\"dropcap\">Kivach Association Interculturelle favorise les échanges interculturels, le lien social, l’intégration et l’adaptation socioculturelle des personnes étrangères vivant en France, des expatriés et, plus largement, de toute personne intéressée par la rencontre des cultures.</p><p>Notre objet se traduit par des activités culturelles, musicales, artistiques, éducatives, sociales et interculturelles : concerts, chorales, festivals, rencontres, conférences, ateliers, expositions et événements gastronomiques.</p><p>L’association peut également mener des actions d’information, de sensibilisation, d’étude et de recherche, et développer des partenariats avec les acteurs associatifs, culturels, éducatifs et publics.</p></div></section><section class=\"principles\"><div><span class=\"roman\">I</span><h2>Rencontrer</h2><p>Créer des occasions de dialogue entre traditions, générations et parcours.</p></div><div><span class=\"roman\">II</span><h2>Partager</h2><p>Faire circuler les arts, les savoirs et les expressions de différentes cultures.</p></div><div><span class=\"roman\">III</span><h2>Faire ensemble</h2><p>Rassembler autour de projets culturels et de partenariats durables.</p></div></section><p class=\"source-note\">Présentation fondée sur les statuts de l’association, établis à Grasse le 16 septembre 2026.</p></main>",
  president: "<main id=\"main\" class=\"inner-page\"><section class=\"page-heading\"><p class=\"eyebrow\">II · Kivach Association Interculturelle</p><h1>Mot de la Présidente</h1><p class=\"lead\">Une invitation à bâtir des passerelles entre les personnes et les cultures.</p><img class=\"ornament\" src=\"/ornament.svg\" alt=\"\" aria-hidden=\"true\"></section><section class=\"president-layout\"><div class=\"portrait-placeholder\"><div class=\"portrait-frame\"><span>Portrait<br>à venir</span></div><p>Ruslana Kivach · Présidente</p></div><div class=\"letter\"><p class=\"letter-salutation\">Chères amies, chers amis,</p><p class=\"dropcap\">La culture nous donne une langue commune, même lorsque nos histoires et nos horizons sont différents. Elle nous invite à écouter, à apprendre et à créer ensemble.</p><p>Avec Kivach Association Interculturelle, nous souhaitons ouvrir un espace de rencontres où la musique, les arts et les traditions deviennent des points de départ pour de nouvelles amitiés.</p><p>J’espère que vous prendrez part à cette aventure, par votre présence, vos idées et votre curiosité. Chacun peut contribuer à faire vivre ce dialogue.</p><p class=\"signature\">Ruslana Kivach</p><p class=\"letter-caption\">Texte de présentation provisoire, à valider par la Présidente avant publication définitive.</p></div></section></main>",
  projects: "<main id=\"main\" class=\"inner-page\"><section class=\"page-heading\"><p class=\"eyebrow\">III · Kivach Association Interculturelle</p><h1>Projets</h1><p class=\"lead\">Des formes diverses pour faire se rencontrer les cultures et celles et ceux qui les portent.</p><img class=\"ornament\" src=\"/ornament.svg\" alt=\"\" aria-hidden=\"true\"></section><section class=\"project-list\"><article class=\"project-card\"><span class=\"project-number\">01</span><div><p class=\"eyebrow\">Musique & voix · Piste de projet</p><h2>Chorale interculturelle</h2><p>Réunir des voix de différentes origines autour d’un répertoire partagé, de répétitions et de rencontres musicales.</p></div><span class=\"project-arrow\" aria-hidden=\"true\">↗</span></article><article class=\"project-card\"><span class=\"project-number\">02</span><div><p class=\"eyebrow\">Rencontres · Piste de projet</p><h2>Les cultures à table</h2><p>Imaginer des moments de découverte autour des cuisines, des récits et des traditions de plusieurs pays.</p></div><span class=\"project-arrow\" aria-hidden=\"true\">↗</span></article><article class=\"project-card\"><span class=\"project-number\">03</span><div><p class=\"eyebrow\">Arts & transmission · Piste de projet</p><h2>Ateliers et conversations</h2><p>Proposer des ateliers, des expositions et des conférences pour apprendre les uns des autres.</p></div><span class=\"project-arrow\" aria-hidden=\"true\">↗</span></article></section><p class=\"source-note\">Ces projets sont des exemples de présentation. Leur calendrier et leur contenu seront confirmés par l’association.</p></main>",
  gallery: "<main id=\"main\" class=\"inner-page\"><section class=\"page-heading\"><p class=\"eyebrow\">IV · Kivach Association Interculturelle</p><h1>Galerie</h1><p class=\"lead\">Un espace pour garder la trace des rencontres, des voix et des moments partagés.</p><img class=\"ornament\" src=\"/ornament.svg\" alt=\"\" aria-hidden=\"true\"></section><section class=\"gallery-grid\"><figure class=\"gallery-tile tile-one\"><div class=\"gallery-art\">I</div><figcaption>Rencontres <span>01</span></figcaption></figure><figure class=\"gallery-tile tile-two\"><div class=\"gallery-art\">II</div><figcaption>Musique <span>02</span></figcaption></figure><figure class=\"gallery-tile tile-three\"><div class=\"gallery-art\">III</div><figcaption>Ateliers <span>03</span></figcaption></figure><figure class=\"gallery-tile tile-four\"><div class=\"gallery-art\">IV</div><figcaption>Cultures <span>04</span></figcaption></figure></section><p class=\"source-note\">Emplacements de maquette : les photographies des activités seront ajoutées après leur sélection.</p></main>",
  contact: "<main id=\"main\" class=\"inner-page\"><section class=\"page-heading\"><p class=\"eyebrow\">V · Kivach Association Interculturelle</p><h1>Contact</h1><p class=\"lead\">Une question, une idée de collaboration ou l’envie de rejoindre l’association ? Entrons en dialogue.</p><img class=\"ornament\" src=\"/ornament.svg\" alt=\"\" aria-hidden=\"true\"></section><section class=\"contact-grid\"><div class=\"contact-details\"><p class=\"eyebrow\">Localisation</p><address>Grasse, France</address><div class=\"contact-rule\"></div><p>Nous accueillerons ici les coordonnées officielles et les informations pratiques de l’association.</p></div><div class=\"contact-form-wrap\"><h2>Écrivez-nous</h2><p>La messagerie sera activée lors de la mise en ligne.</p><form id=\"contact-form\"><label for=\"name\">Votre nom</label><input id=\"name\" name=\"name\" autocomplete=\"name\" required disabled><label for=\"email\">Votre adresse e-mail</label><input id=\"email\" name=\"email\" type=\"email\" autocomplete=\"email\" required disabled><label for=\"message\">Votre message</label><textarea id=\"message\" name=\"message\" rows=\"5\" required disabled></textarea><button type=\"submit\" disabled>Envoyer le message</button><p class=\"form-note\">Formulaire de démonstration — aucun message n’est envoyé.</p></form></div></section></main>",
}

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
  '<div class="page-fold" aria-hidden="true"></div>' +
  pages[currentPage] +
  '<footer class="site-footer"><span>Kivach Association Interculturelle</span><img src="/ornament.svg" alt="" aria-hidden="true"><span>Grasse · France</span></footer>'

document.querySelectorAll<HTMLImageElement>('[data-logo]').forEach((image) => {
  image.src = logoDataUrl
})

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
