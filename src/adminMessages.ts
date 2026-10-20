import type { SupabaseClient } from '@supabase/supabase-js'

type MessageStatus = 'new' | 'read'
type MessageFilter = 'all' | MessageStatus
type ContactMessage = {
  id: string
  created_at: string
  name: string
  email: string
  message: string
  language: string
  page_path: string
  status: MessageStatus
  read_at: string | null
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

function makeButton(label: string, className = ''): HTMLButtonElement {
  const button = document.createElement('button')
  button.type = 'button'
  button.textContent = label
  button.className = className
  return button
}

export function mountMessages(client: SupabaseClient, container: HTMLElement, setStatus: (message: string, error?: boolean) => void): void {
  let activeFilter: MessageFilter = 'all'
  let messages: ContactMessage[] = []

  container.innerHTML = `
    <section class="admin-panel messages-panel">
      <div class="messages-header"><div><p class="admin-section-number">Обратная связь</p><h3>Сообщения с сайта</h3><p>Здесь появляются обращения, отправленные через форму «Напишите нам».</p></div><button type="button" class="admin-secondary" id="refresh-messages">Обновить</button></div>
      <div class="message-counts"><article><span>Новые</span><strong id="messages-new">—</strong></article><article><span>Прочитанные</span><strong id="messages-read">—</strong></article><article><span>Всего</span><strong id="messages-total">—</strong></article></div>
      <div class="message-filters" role="group" aria-label="Фильтр сообщений"><button type="button" data-message-filter="all" class="is-active">Все</button><button type="button" data-message-filter="new">Новые</button><button type="button" data-message-filter="read">Прочитанные</button></div>
      <div id="messages-list" class="messages-list"><p class="admin-empty">Загружаем сообщения…</p></div>
    </section>`

  const list = container.querySelector<HTMLElement>('#messages-list')!
  const setCount = (id: string, value: number) => { const element = container.querySelector<HTMLElement>(`#${id}`); if (element) element.textContent = String(value) }

  function updateFilters(): void {
    container.querySelectorAll<HTMLButtonElement>('[data-message-filter]').forEach((button) => {
      const active = button.dataset.messageFilter === activeFilter
      button.classList.toggle('is-active', active)
      button.setAttribute('aria-pressed', String(active))
    })
  }

  function renderList(): void {
    list.replaceChildren()
    const shown = activeFilter === 'all' ? messages : messages.filter((item) => item.status === activeFilter)
    if (!shown.length) {
      const empty = document.createElement('p')
      empty.className = 'admin-empty'
      empty.textContent = activeFilter === 'new' ? 'Новых сообщений нет.' : activeFilter === 'read' ? 'Прочитанных сообщений нет.' : 'Сообщений пока нет.'
      list.append(empty)
      return
    }
    for (const item of shown) {
      const card = document.createElement('article')
      card.className = `message-card ${item.status === 'new' ? 'is-new' : ''}`

      const header = document.createElement('div')
      header.className = 'message-card-header'
      const identity = document.createElement('div')
      const title = document.createElement('h4')
      title.textContent = item.name
      const email = document.createElement('a')
      email.href = `mailto:${item.email}`
      email.textContent = item.email
      identity.append(title, email)
      const meta = document.createElement('div')
      meta.className = 'message-meta'
      const badge = document.createElement('span')
      badge.className = `message-badge ${item.status === 'new' ? 'is-new' : ''}`
      badge.textContent = item.status === 'new' ? 'Новое' : 'Прочитано'
      const date = document.createElement('time')
      date.dateTime = item.created_at
      date.textContent = formatDate(item.created_at)
      meta.append(badge, date)
      header.append(identity, meta)

      const body = document.createElement('p')
      body.className = 'message-body'
      body.textContent = item.message

      const footer = document.createElement('div')
      footer.className = 'message-card-footer'
      const origin = document.createElement('span')
      origin.textContent = `${item.language.toUpperCase()} · ${item.page_path}`
      const actions = document.createElement('div')
      const toggle = makeButton(item.status === 'new' ? 'Отметить прочитанным' : 'Вернуть в новые', 'admin-secondary')
      toggle.addEventListener('click', async () => {
        toggle.disabled = true
        const next: MessageStatus = item.status === 'new' ? 'read' : 'new'
        const { error } = await client.from('contact_messages').update({ status: next, read_at: next === 'read' ? new Date().toISOString() : null }).eq('id', item.id)
        if (error) { toggle.disabled = false; setStatus(`Не удалось изменить статус: ${error.message}`, true); return }
        await refresh()
      })
      const remove = makeButton('Удалить', 'message-delete')
      remove.addEventListener('click', async () => {
        if (!window.confirm(`Удалить сообщение от ${item.name}? Это действие нельзя отменить.`)) return
        remove.disabled = true
        const { error } = await client.from('contact_messages').delete().eq('id', item.id)
        if (error) { remove.disabled = false; setStatus(`Не удалось удалить сообщение: ${error.message}`, true); return }
        await refresh()
      })
      actions.append(toggle, remove)
      footer.append(origin, actions)
      card.append(header, body, footer)
      list.append(card)
    }
  }

  async function refresh(): Promise<void> {
    const refreshButton = container.querySelector<HTMLButtonElement>('#refresh-messages')
    if (refreshButton) refreshButton.disabled = true
    setStatus('Загружаем сообщения…')
    const { data, error } = await client.from('contact_messages')
      .select('id, created_at, name, email, message, language, page_path, status, read_at')
      .order('created_at', { ascending: false }).limit(500)
    if (refreshButton) refreshButton.disabled = false
    if (error) {
      list.innerHTML = '<p class="admin-empty">Не удалось загрузить сообщения.</p>'
      setStatus(`Не удалось загрузить сообщения: ${error.message}`, true)
      return
    }
    messages = (data ?? []) as ContactMessage[]
    setCount('messages-new', messages.filter((item) => item.status === 'new').length)
    setCount('messages-read', messages.filter((item) => item.status === 'read').length)
    setCount('messages-total', messages.length)
    renderList()
    setStatus(`Сообщения обновлены: ${formatDate(new Date().toISOString())}.`)
  }

  container.querySelector<HTMLButtonElement>('#refresh-messages')?.addEventListener('click', () => { void refresh() })
  container.querySelectorAll<HTMLButtonElement>('[data-message-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.messageFilter as MessageFilter
      updateFilters()
      renderList()
    })
  })
  void refresh()
}
