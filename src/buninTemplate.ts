export const buninPage = `<main id="main" class="inner-page bunin-page">
  <section class="page-heading">
    <p class="eyebrow" data-field="bunin.eyebrow">Projet patrimonial</p>
    <h1 data-field="bunin.title">La Maison d’Ivan Bounine</h1>
    <p class="lead" data-field="bunin.lead">Un projet de sauvegarde et de transmission à Grasse.</p>
    <img class="ornament" src="/ornament.svg" alt="" aria-hidden="true">
  </section>
  <section class="bunin-intro">
    <figure class="bunin-portrait" id="bunin-hero-photo" hidden></figure>
    <div class="bunin-intro-copy">
      <div class="bunin-body prose" data-field="bunin.body"></div>
    </div>
  </section>
  <section class="bunin-photo-grid" id="bunin-photo-grid" aria-label="Photographies du projet" hidden></section>
  <section class="bunin-documents" id="bunin-documents" hidden>
    <div><p class="eyebrow" data-field="bunin.documentsKicker">Documents</p><h2 data-field="bunin.documentsTitle">Documents à consulter</h2><p data-field="bunin.documentsLead">Les documents publiés par l’association sont disponibles ici.</p></div>
    <div id="bunin-document-list" class="document-list"></div>
  </section>
</main>`
