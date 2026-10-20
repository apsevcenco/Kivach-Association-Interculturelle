import './admin.css'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defaultContent, normalizeContent, safeImageUrl, sections, textFields, type GalleryImage, type Project, type ProjectDocument, type ProjectPhoto, type Section } from './cms'
import { supabase } from './supabase'
import { languageNames, locales, localHref, targetLanguageNames, type Locale } from './i18n'
import { loadStats, renderStatsShell } from './adminStats'

const app = document.querySelector<HTMLDivElement>('#admin-app')
if (!app) throw new Error('Missing #admin-app element')

if (!supabase) {
  app.innerHTML = '<main class="admin-gate"><p class="admin-kicker">Kivach · Édition</p><h1>Настройка Supabase</h1><p>Для работы редактора добавьте VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в Environment статического сайта Render и пересоберите сайт.</p><a href="/">Вернуться на сайт</a></main>'
} else {
  void start(supabase, app)
}

async function start(client: SupabaseClient, root: HTMLElement): Promise<void> {
  let draft = defaultContent()
  let activeSection: Section = 'home'
  let activeLocale: Locale = 'fr'
  let email = ''
  let saving = false
  let translating = false

  function setStatus(message: string, error = false): void {
    const status = root.querySelector<HTMLElement>('#admin-status')
    if (status) {
      status.textContent = message
      status.classList.toggle('is-error', error)
    }
  }

  function renderLogin(message = ''): void {
    root.innerHTML = `<main class="admin-gate"><p class="admin-kicker">Kivach · Édition</p><h1>Вход в редакцию</h1><p>Только для администраторов ассоциации.</p><form id="login-form"><label for="admin-email">Электронная почта</label><input id="admin-email" type="email" autocomplete="username" required><label for="admin-password">Пароль</label><input id="admin-password" type="password" autocomplete="current-password" required><button type="submit">Войти</button><p id="admin-status" role="status" class="admin-status"></p></form><a href="/">← Вернуться на сайт</a></main>`
    if (message) setStatus(message, true)
    root.querySelector<HTMLFormElement>('#login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault()
      const form = event.currentTarget as HTMLFormElement
      const emailInput = form.querySelector<HTMLInputElement>('#admin-email')
      const passwordInput = form.querySelector<HTMLInputElement>('#admin-password')
      const button = form.querySelector<HTMLButtonElement>('button')
      if (!emailInput || !passwordInput) return
      if (button) button.disabled = true
      setStatus('Проверяем данные…')
      const { error } = await client.auth.signInWithPassword({ email: emailInput.value.trim(), password: passwordInput.value })
      passwordInput.value = ''
      if (error) {
        if (button) button.disabled = false
        setStatus(error.message, true)
        return
      }
      await enterEditor()
    })
  }

  async function enterEditor(): Promise<void> {
    root.innerHTML = '<main class="admin-gate"><p class="admin-kicker">Kivach · Édition</p><h1>Загрузка редактора…</h1></main>'
    const { data: userData, error: userError } = await client.auth.getUser()
    if (userError || !userData.user) { renderLogin(); return }
    const { data: permission, error: permissionError } = await client.from('site_admins').select('user_id').eq('user_id', userData.user.id).maybeSingle()
    if (permissionError || !permission) {
      await client.auth.signOut()
      renderLogin(permissionError ? 'Не удалось проверить доступ. Убедитесь, что схема Supabase установлена.' : 'У этой учётной записи нет прав редактора.')
      return
    }
    email = userData.user.email ?? ''
    const { data, error } = await client.from('site_content').select('content').eq('id', 1).maybeSingle()
    if (error) {
      renderLogin(`Не удалось загрузить содержимое: ${error.message}`)
      return
    }
    draft = normalizeContent(data?.content)
    renderEditor()
  }

  function renderEditor(): void {
    root.innerHTML = `<header class="admin-header"><div><p class="admin-kicker">Kivach · Édition</p><h1>Редакция сайта</h1></div><div class="admin-account"><span id="admin-email-display"></span><button type="button" id="logout">Выйти</button></div></header><div class="admin-layout"><nav class="admin-sections" aria-label="Разделы сайта"></nav><main class="admin-main"><div class="admin-toolbar"><div><p class="admin-section-number">Содержимое сайта</p><h2 id="section-title"></h2></div><div class="admin-actions"><a id="page-preview" target="_blank" rel="noopener">Открыть страницу ↗</a><button type="button" id="save-content">Сохранить изменения</button></div></div><div class="admin-language"><label for="edit-language">Язык редактирования</label><select id="edit-language">${locales.map((locale) => `<option value="${locale}"${locale === activeLocale ? ' selected' : ''}>${languageNames[locale]}</option>`).join('')}</select><span id="translation-hint"></span></div><div id="translation-actions" class="translation-actions" hidden><button type="button" id="translate-section">Перевести этот раздел с русского</button><button type="button" id="translate-all">Перевести весь сайт с русского</button></div><p id="admin-status" role="status" class="admin-status"></p><div id="section-fields"></div></main></div>`
    root.querySelector<HTMLElement>('#admin-email-display')!.textContent = email
    root.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', async () => {
      await client.auth.signOut()
      renderLogin()
    })
    root.querySelector<HTMLButtonElement>('#save-content')?.addEventListener('click', saveContent)
    root.querySelector<HTMLSelectElement>('#edit-language')?.addEventListener('change', (event) => {
      activeLocale = (event.currentTarget as HTMLSelectElement).value as Locale
      renderSection()
    })
    root.querySelector<HTMLButtonElement>('#translate-section')?.addEventListener('click', () => { void translateScope(false) })
    root.querySelector<HTMLButtonElement>('#translate-all')?.addEventListener('click', () => { void translateScope(true) })
    const nav = root.querySelector<HTMLElement>('.admin-sections')!
    for (const section of sections) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = section.label
      button.className = section.key === activeSection ? 'is-active' : ''
      button.addEventListener('click', () => { activeSection = section.key; renderSection() })
      nav.append(button)
    }
    renderSection()
  }

  function renderSection(): void {
    const section = sections.find((item) => item.key === activeSection)!
    root.querySelector<HTMLElement>('#section-title')!.textContent = section.label
    const preview = root.querySelector<HTMLAnchorElement>('#page-preview')!
    const paths: Partial<Record<Section, string>> = { global: '/', home: '/', about: '/association/', president: '/presidente/', projects: '/projets/', bunin: '/projets/maison-ivan-bounine/', gallery: '/galerie/', contact: '/contact/', cookies: '/cookies/', privacy: '/confidentialite/', legal: '/mentions-legales/' }
    const isStats = activeSection === 'stats'
    preview.hidden = isStats
    root.querySelector<HTMLButtonElement>('#save-content')!.hidden = isStats
    root.querySelector<HTMLElement>('.admin-language')!.hidden = isStats
    if (!isStats) preview.href = localHref(paths[activeSection] ?? '/', activeLocale)
    root.querySelector<HTMLElement>('#translation-actions')!.hidden = isStats || activeLocale !== 'ru'
    root.querySelector<HTMLElement>('#translation-hint')!.textContent = activeLocale === 'ru'
      ? 'Русский текст служит оригиналом для автоматического перевода. После перевода проверьте языки и сохраните.'
      : activeLocale === 'fr' ? 'Исходная французская версия сайта.' : 'Перевод можно исправить вручную после генерации.'
    root.querySelectorAll<HTMLButtonElement>('.admin-sections button').forEach((button, index) => {
      button.classList.toggle('is-active', sections[index].key === activeSection)
    })
    const container = root.querySelector<HTMLElement>('#section-fields')!
    container.replaceChildren()
    if (isStats) {
      root.querySelector<HTMLElement>('#translation-hint')!.textContent = ''
      renderStatsShell(container)
      root.querySelector<HTMLButtonElement>('#refresh-stats')?.addEventListener('click', () => { void loadStats(client, root, setStatus) })
      void loadStats(client, root, setStatus)
      return
    }
    const textPanel = document.createElement('section')
    textPanel.className = 'admin-panel'
    textPanel.append(createHeading('Тексты и заголовки'))
    for (const field of textFields.filter((item) => item.page === activeSection)) {
      const wrapper = document.createElement('div')
      wrapper.className = 'admin-field'
      const label = document.createElement('label')
      const id = `field-${field.key.replaceAll('.', '-')}`
      label.htmlFor = id
      label.textContent = field.label
      const input = field.multiline ? document.createElement('textarea') : document.createElement('input')
      input.id = id
      if (input instanceof HTMLTextAreaElement) {
        input.rows = field.paragraphs || ['cookies', 'privacy', 'legal'].includes(activeSection) ? 10 : 4
        input.addEventListener('input', () => resizeTextarea(input))
      }
      input.value = activeLocale === 'fr' ? (draft.text[field.key] ?? '') : (draft.translations[activeLocale].text[field.key] ?? '')
      input.placeholder = activeLocale === 'fr' ? '' : draft.text[field.key] ?? ''
      input.addEventListener('input', () => {
        if (activeLocale === 'fr') draft.text[field.key] = input.value
        else draft.translations[activeLocale].text[field.key] = input.value
        setStatus('Есть несохранённые изменения')
      })
      wrapper.append(label, input)
      if (field.paragraphs) {
        wrapper.classList.add('admin-field--paragraphs')
        const help = document.createElement('p')
        help.className = 'admin-field-help'
        help.textContent = 'Разделяйте абзацы пустой строкой. На сайте каждый фрагмент станет отдельным абзацем.'
        wrapper.append(help)
      }
      textPanel.append(wrapper)
      if (input instanceof HTMLTextAreaElement) requestAnimationFrame(() => resizeTextarea(input))
    }
    container.append(textPanel)
    if (activeSection === 'global') container.append(createImagePanel('Логотип сайта', 'logo', 'Загрузить новый логотип'))
    if (activeSection === 'president') container.append(createImagePanel('Портрет президента', 'portrait', 'Загрузить портрет'))
    if (activeSection === 'projects') container.append(createCollectionPanel('projects'))
    if (activeSection === 'bunin') container.append(createBuninAssetsPanel())
    if (activeSection === 'gallery') container.append(createCollectionPanel('gallery'))
  }

  function createHeading(text: string): HTMLElement {
    const heading = document.createElement('h3')
    heading.textContent = text
    return heading
  }

  function resizeTextarea(input: HTMLTextAreaElement): void {
    input.style.height = 'auto'
    input.style.height = `${Math.min(Math.max(input.scrollHeight, 90), 520)}px`
  }

  function createImagePanel(title: string, key: 'logo' | 'portrait', uploadLabel: string): HTMLElement {
    const panel = document.createElement('section')
    panel.className = 'admin-panel'
    panel.append(createHeading(title))
    const current = safeImageUrl(draft.images[key] ?? '')
    if (current) {
      const image = document.createElement('img')
      image.className = 'admin-image-preview'
      image.src = current
      image.alt = title
      panel.append(image)
    } else {
      const note = document.createElement('p')
      note.className = 'admin-help'
      note.textContent = key === 'logo' ? 'Сейчас используется исходный логотип сайта.' : 'Портрет пока не добавлен.'
      panel.append(note)
    }
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/webp,image/avif'
    input.setAttribute('aria-label', uploadLabel)
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await uploadImage(file)
      if (url) { draft.images[key] = url; setStatus('Изображение загружено. Сохраните страницу.'); renderSection() }
    })
    panel.append(input)
    if (current) {
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.className = 'admin-secondary'
      remove.textContent = 'Убрать изображение'
      remove.addEventListener('click', () => { draft.images[key] = ''; renderSection(); setStatus('Есть несохранённые изменения') })
      panel.append(remove)
    }
    return panel
  }

  function projectText(item: Project, key: 'category' | 'title' | 'description' | 'imageAlt'): string {
    if (activeLocale === 'fr') return item[key]
    return draft.translations[activeLocale].projects[item.id]?.[key] ?? ''
  }

  function setProjectText(item: Project, key: 'category' | 'title' | 'description' | 'imageAlt', value: string): void {
    if (activeLocale === 'fr') { item[key] = value; return }
    const translations = draft.translations[activeLocale].projects
    translations[item.id] ??= { category: '', title: '', description: '', imageAlt: '' }
    translations[item.id][key] = value
  }

  function galleryText(item: GalleryImage, key: 'caption' | 'imageAlt'): string {
    if (activeLocale === 'fr') return item[key]
    return draft.translations[activeLocale].gallery[item.id]?.[key] ?? ''
  }

  function setGalleryText(item: GalleryImage, key: 'caption' | 'imageAlt', value: string): void {
    if (activeLocale === 'fr') { item[key] = value; return }
    const translations = draft.translations[activeLocale].gallery
    translations[item.id] ??= { caption: '', imageAlt: '' }
    translations[item.id][key] = value
  }

  function projectPhotoText(item: ProjectPhoto, key: 'caption' | 'imageAlt'): string {
    if (activeLocale === 'fr') return item[key]
    return draft.translations[activeLocale].projectPhotos[item.id]?.[key] ?? ''
  }

  function setProjectPhotoText(item: ProjectPhoto, key: 'caption' | 'imageAlt', value: string): void {
    if (activeLocale === 'fr') { item[key] = value; return }
    const translations = draft.translations[activeLocale].projectPhotos
    translations[item.id] ??= { caption: '', imageAlt: '' }
    translations[item.id][key] = value
  }

  function projectDocumentTitle(item: ProjectDocument): string {
    if (activeLocale === 'fr') return item.title
    return draft.translations[activeLocale].projectDocuments[item.id]?.title ?? ''
  }

  function setProjectDocumentTitle(item: ProjectDocument, value: string): void {
    if (activeLocale === 'fr') { item.title = value; return }
    draft.translations[activeLocale].projectDocuments[item.id] ??= { title: '' }
    draft.translations[activeLocale].projectDocuments[item.id].title = value
  }

  function buninProject(): Project {
    return draft.projects.find((item) => item.detailUrl.includes('maison-ivan-bounine')) ?? draft.projects[0]
  }

  function createBuninAssetsPanel(): HTMLElement {
    const project = buninProject()
    const panel = document.createElement('section')
    panel.className = 'admin-panel'
    panel.append(createHeading('Фотографии проекта'))
    const help = document.createElement('p')
    help.className = 'admin-help'
    help.textContent = 'Главная фотография карточки загружается в разделе «Проекты». Здесь можно собрать отдельную фотогалерею страницы без повторов.'
    panel.append(help)
    project.photos.forEach((photo, index) => {
      const card = document.createElement('article')
      card.className = 'admin-card'
      const top = document.createElement('div')
      top.className = 'admin-card-top'
      const title = document.createElement('h4')
      title.textContent = `Фото ${String(index + 1).padStart(2, '0')}`
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Удалить'
      remove.addEventListener('click', () => { project.photos.splice(index, 1); renderSection(); setStatus('Есть несохранённые изменения') })
      top.append(title, remove)
      card.append(top)
      card.append(createBoundField('Подпись', projectPhotoText(photo, 'caption'), (value) => { setProjectPhotoText(photo, 'caption', value) }, false, photo.caption))
      card.append(createBoundField('Описание для доступности', projectPhotoText(photo, 'imageAlt'), (value) => { setProjectPhotoText(photo, 'imageAlt', value) }, false, photo.imageAlt))
      const url = safeImageUrl(photo.imageUrl)
      if (url) {
        const preview = document.createElement('img')
        preview.className = 'admin-image-preview'
        preview.src = url
        preview.alt = projectPhotoText(photo, 'imageAlt') || photo.imageAlt || 'Фотография проекта'
        card.append(preview)
      }
      const file = document.createElement('input')
      file.type = 'file'
      file.accept = 'image/jpeg,image/png,image/webp,image/avif'
      file.setAttribute('aria-label', `Загрузить фото ${index + 1}`)
      file.addEventListener('change', async () => {
        const selected = file.files?.[0]
        if (!selected) return
        const imageUrl = await uploadImage(selected)
        if (imageUrl) { photo.imageUrl = imageUrl; renderSection(); setStatus('Фотография загружена. Сохраните страницу.') }
      })
      card.append(file)
      panel.append(card)
    })
    const addPhoto = document.createElement('button')
    addPhoto.type = 'button'
    addPhoto.className = 'admin-add'
    addPhoto.textContent = '+ Добавить фотографию проекта'
    addPhoto.addEventListener('click', () => { project.photos.push({ id: crypto.randomUUID(), caption: '', imageUrl: '', imageAlt: '' }); renderSection(); setStatus('Есть несохранённые изменения') })
    panel.append(addPhoto)

    panel.append(createHeading('PDF-документы проекта'))
    const documentHelp = document.createElement('p')
    documentHelp.className = 'admin-help'
    documentHelp.textContent = 'После сохранения документы появятся в открытом разделе проекта. Допустимы PDF до 25 МБ.'
    panel.append(documentHelp)
    project.documents.forEach((documentItem, index) => {
      const card = document.createElement('article')
      card.className = 'admin-card'
      const top = document.createElement('div')
      top.className = 'admin-card-top'
      const title = document.createElement('h4')
      title.textContent = `Документ ${String(index + 1).padStart(2, '0')}`
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Удалить'
      remove.addEventListener('click', () => { project.documents.splice(index, 1); renderSection(); setStatus('Есть несохранённые изменения') })
      top.append(title, remove)
      card.append(top)
      card.append(createBoundField('Название документа', projectDocumentTitle(documentItem), (value) => { setProjectDocumentTitle(documentItem, value) }, false, documentItem.title))
      if (documentItem.url) {
        const link = document.createElement('a')
        link.href = documentItem.url
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = 'Открыть загруженный PDF ↗'
        card.append(link)
      }
      const file = document.createElement('input')
      file.type = 'file'
      file.accept = 'application/pdf,.pdf'
      file.setAttribute('aria-label', `Загрузить PDF ${index + 1}`)
      file.addEventListener('change', async () => {
        const selected = file.files?.[0]
        if (!selected) return
        const url = await uploadDocument(selected)
        if (url) { documentItem.url = url; renderSection(); setStatus('PDF загружен. Сохраните страницу.') }
      })
      card.append(file)
      panel.append(card)
    })
    const addDocument = document.createElement('button')
    addDocument.type = 'button'
    addDocument.className = 'admin-add'
    addDocument.textContent = '+ Добавить PDF-документ'
    addDocument.addEventListener('click', () => { project.documents.push({ id: crypto.randomUUID(), title: '', url: '' }); renderSection(); setStatus('Есть несохранённые изменения') })
    panel.append(addDocument)
    return panel
  }

  function createCollectionPanel(kind: 'projects' | 'gallery'): HTMLElement {
    const panel = document.createElement('section')
    panel.className = 'admin-panel'
    panel.append(createHeading(kind === 'projects' ? 'Карточки проектов' : 'Фотографии галереи'))
    const items = draft[kind]
    items.forEach((item, index) => {
      const card = document.createElement('article')
      card.className = 'admin-card'
      const top = document.createElement('div')
      top.className = 'admin-card-top'
      const title = document.createElement('h4')
      title.textContent = `${String(index + 1).padStart(2, '0')} · ${kind === 'projects' ? projectText(item as Project, 'title') || (item as Project).title || 'Новый проект' : galleryText(item as GalleryImage, 'caption') || (item as GalleryImage).caption || 'Новое фото'}`
      top.append(title)
      const actions = document.createElement('div')
      actions.className = 'admin-card-actions'
      for (const [symbol, offset, description] of [['↑', -1, 'Выше'], ['↓', 1, 'Ниже']] as const) {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = symbol
        button.title = description
        button.setAttribute('aria-label', `${description}: ${title.textContent}`)
        button.disabled = index + offset < 0 || index + offset >= items.length
        button.addEventListener('click', () => {
          const list = draft[kind] as Array<Project | GalleryImage>
          ;[list[index], list[index + offset]] = [list[index + offset], list[index]]
          renderSection(); setStatus('Есть несохранённые изменения')
        })
        actions.append(button)
      }
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Удалить'
      remove.addEventListener('click', () => {
        if (!window.confirm('Удалить этот элемент со страницы?')) return
        ;(draft[kind] as Array<Project | GalleryImage>).splice(index, 1)
        renderSection(); setStatus('Есть несохранённые изменения')
      })
      actions.append(remove)
      top.append(actions)
      card.append(top)
      if (kind === 'projects') {
        const project = item as Project
        card.append(createBoundField('Категория', projectText(project, 'category'), (value) => { setProjectText(project, 'category', value) }, false, project.category))
        card.append(createBoundField('Заголовок', projectText(project, 'title'), (value) => { setProjectText(project, 'title', value) }, false, project.title))
        card.append(createBoundField('Описание', projectText(project, 'description'), (value) => { setProjectText(project, 'description', value) }, true, project.description))
        card.append(createBoundField('Описание фотографии для доступности', projectText(project, 'imageAlt'), (value) => { setProjectText(project, 'imageAlt', value) }, false, project.imageAlt))
      } else {
        const image = item as GalleryImage
        card.append(createBoundField('Подпись', galleryText(image, 'caption'), (value) => { setGalleryText(image, 'caption', value) }, false, image.caption))
        card.append(createBoundField('Описание фотографии для доступности', galleryText(image, 'imageAlt'), (value) => { setGalleryText(image, 'imageAlt', value) }, false, image.imageAlt))
      }
      const url = safeImageUrl(item.imageUrl)
      if (url) {
        const preview = document.createElement('img')
        preview.className = 'admin-image-preview'
        preview.src = url
        preview.alt = (kind === 'projects' ? projectText(item as Project, 'imageAlt') : galleryText(item as GalleryImage, 'imageAlt')) || item.imageAlt || 'Изображение'
        card.append(preview)
      }
      const file = document.createElement('input')
      file.type = 'file'
      file.accept = 'image/jpeg,image/png,image/webp,image/avif'
      file.setAttribute('aria-label', `Загрузить фото: ${title.textContent}`)
      file.addEventListener('change', async () => {
        const selected = file.files?.[0]
        if (!selected) return
        const imageUrl = await uploadImage(selected)
        if (imageUrl) { item.imageUrl = imageUrl; renderSection(); setStatus('Изображение загружено. Сохраните страницу.') }
      })
      card.append(file)
      if (url) {
        const removeImage = document.createElement('button')
        removeImage.type = 'button'
        removeImage.className = 'admin-secondary'
        removeImage.textContent = 'Убрать фотографию'
        removeImage.addEventListener('click', () => { item.imageUrl = ''; renderSection(); setStatus('Есть несохранённые изменения') })
        card.append(removeImage)
      }
      panel.append(card)
    })
    const add = document.createElement('button')
    add.type = 'button'
    add.className = 'admin-add'
    add.textContent = kind === 'projects' ? '+ Добавить проект' : '+ Добавить фото'
    add.addEventListener('click', () => {
      if (kind === 'projects') draft.projects.push({ id: crypto.randomUUID(), category: '', title: '', description: '', imageUrl: '', imageAlt: '', detailUrl: '', photos: [], documents: [] })
      else draft.gallery.push({ id: crypto.randomUUID(), caption: '', imageUrl: '', imageAlt: '' })
      renderSection(); setStatus('Есть несохранённые изменения')
    })
    panel.append(add)
    return panel
  }

  function createBoundField(labelText: string, value: string, update: (value: string) => void, multiline = false, fallback = ''): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'admin-field'
    const label = document.createElement('label')
    const input = multiline ? document.createElement('textarea') : document.createElement('input')
    input.id = `item-${crypto.randomUUID()}`
    label.htmlFor = input.id
    label.textContent = labelText
    if (input instanceof HTMLTextAreaElement) input.rows = 3
    input.value = value
    if (activeLocale !== 'fr') input.placeholder = fallback
    input.addEventListener('input', () => { update(input.value); setStatus('Есть несохранённые изменения') })
    wrapper.append(label, input)
    return wrapper
  }

  async function uploadImage(file: File): Promise<string> {
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }
    const extension = extensions[file.type]
    if (!extension || file.size > 10 * 1024 * 1024) {
      setStatus('Допустимы JPEG, PNG, WebP или AVIF до 10 МБ.', true)
      return ''
    }
    setStatus('Загружаем изображение…')
    const path = `uploads/${crypto.randomUUID()}.${extension}`
    const { error } = await client.storage.from('site-media').upload(path, file, { contentType: file.type, upsert: false })
    if (error) { setStatus(`Ошибка загрузки: ${error.message}`, true); return '' }
    const { data } = client.storage.from('site-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function uploadDocument(file: File): Promise<string> {
    if (file.type !== 'application/pdf' || file.size > 25 * 1024 * 1024) {
      setStatus('Допустим только PDF до 25 МБ.', true)
      return ''
    }
    setStatus('Загружаем PDF…')
    const path = `uploads/${crypto.randomUUID()}.pdf`
    const { error } = await client.storage.from('site-media').upload(path, file, { contentType: 'application/pdf', upsert: false })
    if (error) { setStatus(`Ошибка загрузки PDF: ${error.message}`, true); return '' }
    const { data } = client.storage.from('site-media').getPublicUrl(path)
    return data.publicUrl
  }

  async function translateScope(all: boolean): Promise<void> {
    if (translating || activeLocale !== 'ru') return
    const endpoint = import.meta.env.VITE_TRANSLATION_API_URL?.trim().replace(/\/$/, '')
    if (!endpoint) {
      setStatus('Сервис перевода пока не подключён. Добавьте VITE_TRANSLATION_API_URL в Render Static Site.', true)
      return
    }
    const { data: sessionData } = await client.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) { setStatus('Сессия истекла. Войдите снова.', true); return }

    const items: Record<string, string> = {}
    for (const field of textFields) {
      if (!all && field.page !== activeSection) continue
      const value = draft.translations.ru.text[field.key]?.trim()
      if (value) items[`text|${field.key}`] = value
    }
    if (all || activeSection === 'projects') {
      for (const project of draft.projects) {
        for (const key of ['category', 'title', 'description', 'imageAlt'] as const) {
          const value = draft.translations.ru.projects[project.id]?.[key]?.trim()
          if (value) items[`project|${project.id}|${key}`] = value
        }
      }
    }
    if (all || activeSection === 'bunin') {
      const project = buninProject()
      for (const photo of project.photos) {
        for (const key of ['caption', 'imageAlt'] as const) {
          const value = draft.translations.ru.projectPhotos[photo.id]?.[key]?.trim()
          if (value) items[`projectPhoto|${photo.id}|${key}`] = value
        }
      }
      for (const documentItem of project.documents) {
        const value = draft.translations.ru.projectDocuments[documentItem.id]?.title?.trim()
        if (value) items[`projectDocument|${documentItem.id}|title`] = value
      }
    }
    if (all || activeSection === 'gallery') {
      for (const image of draft.gallery) {
        for (const key of ['caption', 'imageAlt'] as const) {
          const value = draft.translations.ru.gallery[image.id]?.[key]?.trim()
          if (value) items[`gallery|${image.id}|${key}`] = value
        }
      }
    }
    const entries = Object.entries(items)
    if (!entries.length) { setStatus('Сначала заполните русский текст этого раздела.', true); return }
    translating = true
    root.querySelectorAll<HTMLButtonElement>('#translation-actions button').forEach((button) => { button.disabled = true })
    const targets: Array<Exclude<Locale, 'ru'>> = ['fr', 'en', 'de', 'it', 'ar', 'es']
    let completed = 0
    try {
      for (const target of targets) {
        for (let index = 0; index < entries.length; index += 25) {
          const chunk = Object.fromEntries(entries.slice(index, index + 25))
          setStatus(`Переводим на ${languageNames[target]}… ${completed + 1} / ${targets.length * Math.ceil(entries.length / 25)}`)
          const response = await fetch(`${endpoint}/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ target, items: chunk }),
          })
          const payload = await response.json() as { translations?: Record<string, string>; error?: string }
          if (!response.ok || !payload.translations) throw new Error(payload.error || `Ошибка сервера (${response.status})`)
          for (const [key, value] of Object.entries(payload.translations)) {
            const [kind, id, field] = key.split('|')
            if (kind === 'text') {
              if (target === 'fr') draft.text[id] = value
              else draft.translations[target].text[id] = value
            } else if (kind === 'project' && field) {
              const project = draft.projects.find((item) => item.id === id)
              if (!project || !['category', 'title', 'description', 'imageAlt'].includes(field)) continue
              const property = field as 'category' | 'title' | 'description' | 'imageAlt'
              if (target === 'fr') project[property] = value
              else {
                draft.translations[target].projects[id] ??= { category: '', title: '', description: '', imageAlt: '' }
                draft.translations[target].projects[id][property] = value
              }
            } else if (kind === 'gallery' && field) {
              const image = draft.gallery.find((item) => item.id === id)
              if (!image || !['caption', 'imageAlt'].includes(field)) continue
              const property = field as 'caption' | 'imageAlt'
              if (target === 'fr') image[property] = value
              else {
                draft.translations[target].gallery[id] ??= { caption: '', imageAlt: '' }
                draft.translations[target].gallery[id][property] = value
              }
            } else if (kind === 'projectPhoto' && field) {
              const photo = draft.projects.flatMap((item) => item.photos).find((item) => item.id === id)
              if (!photo || !['caption', 'imageAlt'].includes(field)) continue
              const property = field as 'caption' | 'imageAlt'
              if (target === 'fr') photo[property] = value
              else {
                draft.translations[target].projectPhotos[id] ??= { caption: '', imageAlt: '' }
                draft.translations[target].projectPhotos[id][property] = value
              }
            } else if (kind === 'projectDocument' && field === 'title') {
              const documentItem = draft.projects.flatMap((item) => item.documents).find((item) => item.id === id)
              if (!documentItem) continue
              if (target === 'fr') documentItem.title = value
              else {
                draft.translations[target].projectDocuments[id] ??= { title: '' }
                draft.translations[target].projectDocuments[id].title = value
              }
            }
          }
          completed++
        }
      }
      setStatus(`Готово: переведено на ${targets.map((target) => targetLanguageNames[target]).join(', ')}. Проверьте текст и нажмите «Сохранить изменения».`)
    } catch (error) {
      setStatus(`Перевод остановлен после ${completed} частей: ${error instanceof Error ? error.message : 'неизвестная ошибка'}. Успешные части остались в редакторе; проверьте их перед сохранением.`, true)
    } finally {
      translating = false
      root.querySelectorAll<HTMLButtonElement>('#translation-actions button').forEach((button) => { button.disabled = false })
    }
  }

  async function saveContent(): Promise<void> {
    if (saving) return
    saving = true
    const button = root.querySelector<HTMLButtonElement>('#save-content')
    if (button) button.disabled = true
    setStatus('Сохраняем…')
    const { error } = await client.from('site_content').upsert({ id: 1, content: draft }, { onConflict: 'id' })
    saving = false
    if (button) button.disabled = false
    setStatus(error ? `Не удалось сохранить: ${error.message}` : 'Сохранено. Обновите открытую страницу сайта, чтобы увидеть изменения.', Boolean(error))
  }

  renderLogin()
  const { data: sessionData } = await client.auth.getSession()
  if (sessionData.session) await enterEditor()
}

