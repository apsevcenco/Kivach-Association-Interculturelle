import './admin.css'
import type { SupabaseClient } from '@supabase/supabase-js'
import { defaultContent, normalizeContent, safeImageUrl, sections, textFields, type GalleryImage, type Project, type Section } from './cms'
import { supabase } from './supabase'

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
  let email = ''
  let saving = false

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
    root.innerHTML = `<header class="admin-header"><div><p class="admin-kicker">Kivach · Édition</p><h1>Редакция сайта</h1></div><div class="admin-account"><span id="admin-email-display"></span><button type="button" id="logout">Выйти</button></div></header><div class="admin-layout"><nav class="admin-sections" aria-label="Разделы сайта"></nav><main class="admin-main"><div class="admin-toolbar"><div><p class="admin-section-number">Содержимое сайта</p><h2 id="section-title"></h2></div><div class="admin-actions"><a id="page-preview" target="_blank" rel="noopener">Открыть страницу ↗</a><button type="button" id="save-content">Сохранить изменения</button></div></div><p id="admin-status" role="status" class="admin-status"></p><div id="section-fields"></div></main></div>`
    root.querySelector<HTMLElement>('#admin-email-display')!.textContent = email
    root.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', async () => {
      await client.auth.signOut()
      renderLogin()
    })
    root.querySelector<HTMLButtonElement>('#save-content')?.addEventListener('click', saveContent)
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
    const paths: Record<Section, string> = { global: '/', home: '/', about: '/association/', president: '/presidente/', projects: '/projets/', gallery: '/galerie/', contact: '/contact/' }
    preview.href = paths[activeSection]
    root.querySelectorAll<HTMLButtonElement>('.admin-sections button').forEach((button, index) => {
      button.classList.toggle('is-active', sections[index].key === activeSection)
    })
    const container = root.querySelector<HTMLElement>('#section-fields')!
    container.replaceChildren()
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
      if (input instanceof HTMLTextAreaElement) input.rows = 4
      input.value = draft.text[field.key] ?? ''
      input.addEventListener('input', () => { draft.text[field.key] = input.value; setStatus('Есть несохранённые изменения') })
      wrapper.append(label, input)
      textPanel.append(wrapper)
    }
    container.append(textPanel)
    if (activeSection === 'global') container.append(createImagePanel('Логотип сайта', 'logo', 'Загрузить новый логотип'))
    if (activeSection === 'president') container.append(createImagePanel('Портрет президента', 'portrait', 'Загрузить портрет'))
    if (activeSection === 'projects') container.append(createCollectionPanel('projects'))
    if (activeSection === 'gallery') container.append(createCollectionPanel('gallery'))
  }

  function createHeading(text: string): HTMLElement {
    const heading = document.createElement('h3')
    heading.textContent = text
    return heading
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
      title.textContent = `${String(index + 1).padStart(2, '0')} · ${kind === 'projects' ? (item as Project).title || 'Новый проект' : (item as GalleryImage).caption || 'Новое фото'}`
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
        card.append(createBoundField('Категория', project.category, (value) => { project.category = value }))
        card.append(createBoundField('Заголовок', project.title, (value) => { project.title = value }))
        card.append(createBoundField('Описание', project.description, (value) => { project.description = value }, true))
      } else {
        const image = item as GalleryImage
        card.append(createBoundField('Подпись', image.caption, (value) => { image.caption = value }))
      }
      card.append(createBoundField('Описание фотографии для доступности', item.imageAlt, (value) => { item.imageAlt = value }))
      const url = safeImageUrl(item.imageUrl)
      if (url) {
        const preview = document.createElement('img')
        preview.className = 'admin-image-preview'
        preview.src = url
        preview.alt = item.imageAlt || 'Изображение'
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
      if (kind === 'projects') draft.projects.push({ id: crypto.randomUUID(), category: '', title: '', description: '', imageUrl: '', imageAlt: '' })
      else draft.gallery.push({ id: crypto.randomUUID(), caption: '', imageUrl: '', imageAlt: '' })
      renderSection(); setStatus('Есть несохранённые изменения')
    })
    panel.append(add)
    return panel
  }

  function createBoundField(labelText: string, value: string, update: (value: string) => void, multiline = false): HTMLElement {
    const wrapper = document.createElement('div')
    wrapper.className = 'admin-field'
    const label = document.createElement('label')
    const input = multiline ? document.createElement('textarea') : document.createElement('input')
    input.id = `item-${crypto.randomUUID()}`
    label.htmlFor = input.id
    label.textContent = labelText
    if (input instanceof HTMLTextAreaElement) input.rows = 3
    input.value = value
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
