import type { SupabaseClient } from '@supabase/supabase-js'

type Visit = {
  created_at: string
  visit_date: string
  page_key: string
  page_path: string
  language: string
  session_id: string | null
  referrer: string | null
}

const languageNames: Record<string, string> = {
  fr: 'Français', en: 'English', ru: 'Русский', de: 'Deutsch',
  it: 'Italiano', ar: 'العربية', es: 'Español',
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(value))
  } catch { return value }
}

function rows(values: Map<string, number>, empty: string): string {
  const sorted = Array.from(values.entries()).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return `<p class="admin-empty">${escapeHtml(empty)}</p>`
  const maximum = Math.max(...sorted.map(([, value]) => value), 1)
  return sorted.slice(0, 12).map(([label, value]) => `
    <div class="stats-row">
      <div><span>${escapeHtml(label)}</span><i style="--value:${Math.max(4, Math.round(value / maximum * 100))}%"></i></div>
      <strong>${value}</strong>
    </div>`).join('')
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function renderStatsShell(container: HTMLElement): void {
  container.innerHTML = `
    <section class="admin-panel stats-panel">
      <div class="stats-header"><div><p class="admin-section-number">Последние 30 дней</p><h3>Статистика посещений</h3></div><button type="button" class="admin-secondary" id="refresh-stats">Обновить</button></div>
      <div class="stats-grid">
        <article><span>Сегодня</span><strong id="stats-today">—</strong><small>просмотров</small></article>
        <article><span>Вчера</span><strong id="stats-yesterday">—</strong><small>просмотров</small></article>
        <article><span>7 дней</span><strong id="stats-week">—</strong><small>просмотров</small></article>
        <article><span>30 дней</span><strong id="stats-month">—</strong><small>просмотров</small></article>
        <article><span>Всё время</span><strong id="stats-total">—</strong><small>просмотров</small></article>
        <article><span>Посетители</span><strong id="stats-unique">—</strong><small>уникальные сессии</small></article>
      </div>
      <p class="stats-summary" id="stats-pages-summary">За последние 30 дней: —</p>
      <section class="stats-chart-wrap"><h4>Посещения по дням</h4><div class="stats-chart" id="stats-chart" aria-label="График посещений за 30 дней"></div></section>
      <div class="stats-columns">
        <section><h4>Популярные страницы</h4><div class="stats-table" id="stats-pages-list"></div></section>
        <section><h4>Языки</h4><div class="stats-table" id="stats-languages"></div></section>
        <section><h4>Источники переходов</h4><div class="stats-table" id="stats-referrers"></div></section>
        <section><h4>Последние посещения</h4><div class="stats-table" id="stats-recent"></div></section>
      </div>
      <p class="admin-help">Учитываются просмотры публичных страниц. «Посетители» — уникальные сессии браузера; личные данные и полные адреса переходов не сохраняются.</p>
    </section>`
}

export async function loadStats(client: SupabaseClient, root: HTMLElement, setStatus: (message: string, error?: boolean) => void): Promise<void> {
  const since = new Date()
  since.setDate(since.getDate() - 29)
  since.setHours(0, 0, 0, 0)
  setStatus('Загружаем статистику…')
  const [periodResult, totalResult] = await Promise.all([
    client.from('page_visits')
      .select('created_at, visit_date, page_key, page_path, language, session_id, referrer')
      .gte('created_at', since.toISOString()).order('created_at', { ascending: false }).limit(5000),
    client.from('page_visits').select('id', { count: 'exact', head: true }),
  ])
  if (periodResult.error) {
    setStatus(`Не удалось загрузить статистику: ${periodResult.error.message}`, true)
    return
  }

  const visits = (periodResult.data ?? []) as Visit[]
  const today = dayKey(new Date())
  const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = dayKey(yesterdayDate)
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 6); weekStart.setHours(0, 0, 0, 0)
  const pageCounts = new Map<string, number>()
  const languages = new Map<string, number>()
  const referrers = new Map<string, number>()
  const daily = new Map<string, number>()
  const sessions = new Set<string>()

  for (let offset = 0; offset < 30; offset += 1) {
    const day = new Date()
    day.setDate(day.getDate() - (29 - offset))
    daily.set(dayKey(day), 0)
  }
  visits.forEach((visit) => {
    const page = visit.page_path || visit.page_key || '—'
    pageCounts.set(page, (pageCounts.get(page) ?? 0) + 1)
    const language = languageNames[visit.language] ?? visit.language ?? '—'
    languages.set(language, (languages.get(language) ?? 0) + 1)
    const source = visit.referrer || 'Прямые переходы'
    referrers.set(source, (referrers.get(source) ?? 0) + 1)
    const localVisitDate = dayKey(new Date(visit.created_at))
    if (daily.has(localVisitDate)) daily.set(localVisitDate, (daily.get(localVisitDate) ?? 0) + 1)
    if (visit.session_id) sessions.add(visit.session_id)
  })

  const setText = (id: string, value: string) => { const element = root.querySelector<HTMLElement>(`#${id}`); if (element) element.textContent = value }
  setText('stats-today', String(visits.filter((visit) => dayKey(new Date(visit.created_at)) === today).length))
  setText('stats-yesterday', String(visits.filter((visit) => dayKey(new Date(visit.created_at)) === yesterday).length))
  setText('stats-week', String(visits.filter((visit) => new Date(visit.created_at) >= weekStart).length))
  setText('stats-month', String(visits.length))
  setText('stats-total', String(totalResult.error ? visits.length : totalResult.count ?? visits.length))
  setText('stats-unique', String(sessions.size))
  setText('stats-pages-summary', `За последние 30 дней открыто ${pageCounts.size} ${pageCounts.size === 1 ? 'страница' : pageCounts.size < 5 ? 'страницы' : 'страниц'}; показано до 5 000 последних просмотров.`)

  const chart = root.querySelector<HTMLElement>('#stats-chart')
  if (chart) {
    const max = Math.max(...daily.values(), 1)
    chart.innerHTML = Array.from(daily.entries()).map(([date, value], index) => {
      const label = index === 0 || index === 29 || index % 5 === 0 ? date.slice(5).replace('-', '.') : ''
      return `<div class="stats-day" title="${escapeHtml(date)}: ${value}"><i style="--height:${Math.max(value ? 8 : 2, Math.round(value / max * 100))}%"></i><span>${label}</span></div>`
    }).join('')
  }
  const pageList = root.querySelector<HTMLElement>('#stats-pages-list'); if (pageList) pageList.innerHTML = rows(pageCounts, 'Посещений пока нет.')
  const languageList = root.querySelector<HTMLElement>('#stats-languages'); if (languageList) languageList.innerHTML = rows(languages, 'Данных пока нет.')
  const referrerList = root.querySelector<HTMLElement>('#stats-referrers'); if (referrerList) referrerList.innerHTML = rows(referrers, 'Данных пока нет.')
  const recent = root.querySelector<HTMLElement>('#stats-recent')
  if (recent) recent.innerHTML = visits.length ? visits.slice(0, 12).map((visit) => `<div class="stats-row stats-recent"><div><span>${escapeHtml(visit.page_path || visit.page_key)}</span><small>${escapeHtml(languageNames[visit.language] ?? visit.language)}</small></div><strong>${escapeHtml(formatDate(visit.created_at))}</strong></div>`).join('') : '<p class="admin-empty">Посещений пока нет.</p>'
  setStatus(`Статистика обновлена: ${formatDate(new Date().toISOString())}.`)
}
