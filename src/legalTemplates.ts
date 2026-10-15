export type LegalPage = 'cookies' | 'privacy' | 'legal'

type LegalSection = { id: string; label: string; heading: string; body: string }
type LegalDocument = { label: string; eyebrow: string; title: string; lead: string; sections: LegalSection[] }

export const legalDocuments: Record<LegalPage, LegalDocument> = {
  cookies: {
    label: 'Политика cookies',
    eyebrow: 'VI · Informations du site',
    title: 'Politique des cookies',
    lead: 'Une information claire sur le stockage utilisé lors de votre visite.',
    sections: [
      { id: 'necessary', label: 'Необходимое хранение', heading: 'Stockage nécessaire', body: 'Le site mémorise dans le stockage local de votre navigateur la fermeture de l’avis relatif aux cookies pendant six mois. L’accès réservé aux administrateurs y conserve aussi les données nécessaires pour maintenir leur connexion. Ces éléments servent au fonctionnement des services demandés.' },
      { id: 'optional', label: 'Необязательные трекеры', heading: 'Traceurs facultatifs', body: 'À ce jour, le site ne dépose pas de traceurs publicitaires ni de mesure d’audience facultative. Il n’y a donc pas de bouton d’acceptation de tels traceurs. Si cette situation change, le site demandera le consentement nécessaire avant leur activation.' },
      { id: 'services', label: 'Внешние сервисы', heading: 'Services techniques', body: 'Le site est hébergé par Render, ses contenus éditoriaux sont chargés depuis Supabase et ses polices peuvent être fournies par Google Fonts. Ces services peuvent recevoir des données techniques, notamment l’adresse IP, lors du chargement des pages.' },
      { id: 'control', label: 'Управление', heading: 'Votre contrôle', body: 'Le lien « Gérer les cookies » dans le pied de page permet de rouvrir cet avis. Vous pouvez aussi effacer les données du site dans les paramètres de votre navigateur. La politique de confidentialité détaille les traitements de données personnelles.' },
    ],
  },
  privacy: {
    label: 'Конфиденциальность',
    eyebrow: 'VII · Informations du site',
    title: 'Politique de confidentialité',
    lead: 'Comment l’association traite les données liées à ce site.',
    sections: [
      { id: 'controller', label: 'Ответственный', heading: 'Responsable du traitement', body: 'Kivach Association Interculturelle, association établie à Grasse, France. Pour toute question relative à vos données, écrivez à kivach.association@gmail.com.' },
      { id: 'data', label: 'Какие данные', heading: 'Données concernées', body: 'Lors de la consultation du site, des données techniques telles que l’adresse IP et les informations de requête peuvent être traitées par les prestataires d’hébergement. Le formulaire de contact affiché sur le site est désactivé et ne transmet actuellement aucun message. Si vous écrivez directement à l’association, les données que vous communiquez seront utilisées pour vous répondre.' },
      { id: 'purposes', label: 'Цели и основания', heading: 'Finalités et bases juridiques', body: 'Les données techniques servent à afficher et sécuriser le site, sur la base de l’intérêt légitime de l’association. Les messages reçus directement servent à traiter votre demande. Les données de connexion des administrateurs servent à protéger l’accès à l’éditeur.' },
      { id: 'recipients', label: 'Получатели', heading: 'Destinataires et services', body: 'Les données techniques peuvent être traitées par Render (hébergement), Supabase (authentification et contenus) et Google Fonts (chargement des polices). L’outil OpenAI est utilisé uniquement par les administrateurs pour traduire des textes éditoriaux ; les données des visiteurs ne lui sont pas envoyées à cette fin.' },
      { id: 'retention', label: 'Срок хранения', heading: 'Durées de conservation', body: 'Le choix de fermeture de l’avis cookies est conservé pendant six mois. La session de l’administrateur est conservée jusqu’à sa déconnexion ou à son expiration. Les échanges envoyés directement à l’association et les journaux techniques sont conservés pendant la durée nécessaire à leur traitement, à la sécurité du service et aux obligations applicables.' },
      { id: 'rights', label: 'Права посетителя', heading: 'Vos droits', body: 'Selon votre situation, vous pouvez demander l’accès, la rectification, l’effacement ou la limitation du traitement de vos données, et vous y opposer. Adressez votre demande à kivach.association@gmail.com. Si la réponse ne vous satisfait pas, vous pouvez déposer une réclamation auprès de la CNIL.' },
    ],
  },
  legal: {
    label: 'Mentions légales',
    eyebrow: 'VIII · Informations du site',
    title: 'Mentions légales',
    lead: 'Informations relatives à l’édition et à l’hébergement de ce site.',
    sections: [
      { id: 'publisher', label: 'Издатель сайта', heading: 'Éditeur du site', body: 'Kivach Association Interculturelle, association régie par la loi du 1er juillet 1901. Siège social selon les statuts : 17 avenue Yves-Emmanuel-Baudoin, 06130 Grasse, France. Contact : kivach.association@gmail.com.' },
      { id: 'director', label: 'Ответственный за публикацию', heading: 'Direction de la publication', body: 'Ruslana Kivach, Présidente de Kivach Association Interculturelle.' },
      { id: 'hosting', label: 'Хостинг', heading: 'Hébergement', body: 'Render Services, Inc., 525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis. Téléphone : +1 415 319 8186. Site : https://render.com.' },
      { id: 'rights', label: 'Авторские права', heading: 'Propriété intellectuelle', body: 'Les textes, éléments graphiques et photographies publiés sur ce site sont protégés par les droits de leurs titulaires respectifs. Toute réutilisation nécessite une autorisation préalable, sauf disposition légale contraire.' },
      { id: 'contact', label: 'Контакт', heading: 'Nous contacter', body: 'Pour signaler une erreur ou poser une question concernant ce site, écrivez à kivach.association@gmail.com.' },
    ],
  },
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

export const legalPages = Object.fromEntries(
  (Object.entries(legalDocuments) as [LegalPage, LegalDocument][]).map(([page, document]) => [
    page,
    `<main id="main" class="inner-page policy-page"><section class="page-heading"><p class="eyebrow" data-field="${page}.eyebrow">${escapeHtml(document.eyebrow)}</p><h1 data-field="${page}.title">${escapeHtml(document.title)}</h1><p class="lead" data-field="${page}.lead">${escapeHtml(document.lead)}</p><img class="ornament" src="/ornament.svg" alt="" aria-hidden="true"></section><div class="policy-sections">${document.sections.map((section, index) => `<section class="policy-section"><span class="policy-number">${String(index + 1).padStart(2, '0')}</span><div><h2 data-field="${page}.${section.id}.heading">${escapeHtml(section.heading)}</h2><p data-field="${page}.${section.id}.body">${escapeHtml(section.body)}</p></div></section>`).join('')}</div></main>`,
  ]),
) as Record<LegalPage, string>

