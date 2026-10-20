import type { SupabaseClient } from '@supabase/supabase-js'

export type StatsPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'all'

type Visit = {
  id?: string
  created_at: string
  visit_date: string
  page_key: string
  page_path: string
  language: string
  session_id: string | null
  visitor_id: string | null
  referrer: string | null
  country_code: string | null
  device_type: string | null
  browser_name: string | null
  browser_language: string | null
}

type PeriodRange = { label: string; start: Date | null; end: Date }
type Bucket = { key: string; label: string; value: number }

const pageSize = 1000
const maximumVisits = 50000
let loadSequence = 0

function countryName(code: string | null): string {
  if (!code) return 'Не определено'
  try { return new Intl.DisplayNames('ru', { type: 'region' }).of(code) ?? code } catch { return code }
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

function rows(values: Map<string, number>, empty: string, limit = 10): string {
  const sorted = Array.from(values.entries()).sort((a, b) => b[1] - a[1])
  if (!sorted.length) return `<p class="admin-empty">${escapeHtml(empty)}</p>`
  const maximum = Math.max(...sorted.map(([, value]) => value), 1)
  return sorted.slice(0, limit).map(([label, value]) => `
    <div class="stats-row">
      <div><span title="${escapeHtml(label)}">${escapeHtml(label)}</span><i style="--value:${Math.max(4, Math.round(value / maximum * 100))}%"></i></div>
      <strong>${value}</strong>
    </div>`).join('')
}

function startOfDay(date = new Date()): Date {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function rangeFor(period: StatsPeriod): PeriodRange {
  const now = new Date()
  const today = startOfDay(now)
  if (period === 'today') return { label: 'Сегодня', start: today, end: now }
  if (period === 'yesterday') {
    const start = new Date(today); start.setDate(start.getDate() - 1)
    return { label: 'Вчера', start, end: today }
  }
  if (period === '7d') {
    const start = new Date(today); start.setDate(start.getDate() - 6)
    return { label: '7 дней', start, end: now }
  }
  if (period === '30d') {
    const start = new Date(today); start.setDate(start.getDate() - 29)
    return { label: '30 дней', start, end: now }
  }
  return { label: 'Всё время', start: null, end: now }
}

function isPublicVisit(visit: Visit): boolean {
  const path = visit.page_path?.trim() || '/'
  return !/^\/(?:[a-z]{2}\/)?admin(?:\/|$)/i.test(path)
}

function identity(visit: Visit, index = 0): string {
  return visit.visitor_id || visit.session_id || visit.id || `anonymous-${index}`
}

function sessionIdentity(visit: Visit, index = 0): string {
  return visit.session_id || visit.visitor_id || visit.id || `session-${index}`
}

function sourceName(value: string | null): string {
  if (!value) return 'Прямой вход'
  if (value === 'internal') return 'Внутренний переход'
  return value
}

function deviceName(value: string | null): string {
  if (value === 'mobile') return 'Мобильные'
  if (value === 'desktop') return 'Компьютеры'
  if (value === 'tablet') return 'Планшеты'
  return 'Не определено'
}

function periodVisits(visits: Visit[], range: PeriodRange): Visit[] {
  return visits.filter((visit) => {
    const date = new Date(visit.created_at)
    return (!range.start || date >= range.start) && date < range.end
  })
}

function buildDailyBuckets(visits: Visit[], start: Date, days: number): Bucket[] {
  const buckets: Bucket[] = []
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start); date.setDate(date.getDate() + offset)
    const key = dayKey(date)
    buckets.push({ key, label: `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`, value: 0 })
  }
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  visits.forEach((visit) => { const bucket = byKey.get(dayKey(new Date(visit.created_at))); if (bucket) bucket.value += 1 })
  return buckets
}

function chartBuckets(visits: Visit[], period: StatsPeriod, range: PeriodRange, allVisits: Visit[]): { title: string; buckets: Bucket[] } {
  if (period === 'today' || period === 'yesterday') {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ key: String(hour), label: `${String(hour).padStart(2, '0')}:00`, value: 0 }))
    visits.forEach((visit) => { buckets[new Date(visit.created_at).getHours()].value += 1 })
    return { title: 'Динамика по часам', buckets }
  }
  if (period === '7d' && range.start) return { title: 'Динамика посещений', buckets: buildDailyBuckets(visits, range.start, 7) }
  if (period === '30d' && range.start) return { title: 'Динамика посещений', buckets: buildDailyBuckets(visits, range.start, 30) }

  const oldest = allVisits.at(-1)
  if (!oldest) return { title: 'Динамика посещений', buckets: [] }
  const first = startOfDay(new Date(oldest.created_at))
  const elapsedDays = Math.max(1, Math.ceil((Date.now() - first.getTime()) / 86400000) + 1)
  if (elapsedDays <= 62) return { title: 'Динамика посещений', buckets: buildDailyBuckets(visits, first, elapsedDays) }

  const firstMonth = new Date(first.getFullYear(), first.getMonth(), 1)
  const buckets: Bucket[] = []
  const cursor = new Date(firstMonth)
  const currentMonth = new Date(); currentMonth.setDate(1); currentMonth.setHours(0, 0, 0, 0)
  while (cursor <= currentMonth) {
    buckets.push({ key: monthKey(cursor), label: `${String(cursor.getMonth() + 1).padStart(2, '0')}.${String(cursor.getFullYear()).slice(-2)}`, value: 0 })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))
  visits.forEach((visit) => { const bucket = byKey.get(monthKey(new Date(visit.created_at))); if (bucket) bucket.value += 1 })
  return { title: 'Динамика по месяцам', buckets }
}

async function fetchAllVisits(client: SupabaseClient): Promise<{ visits: Visit[]; truncated: boolean }> {
  const visits: Visit[] = []
  const columns = 'id, created_at, visit_date, page_key, page_path, language, session_id, visitor_id, referrer, country_code, device_type, browser_name, browser_language'
  for (let from = 0; from < maximumVisits; from += pageSize) {
    const { data, error } = await client.from('page_visits').select(columns)
      .not('page_path', 'like', '/admin%').order('created_at', { ascending: false }).range(from, from + pageSize - 1)
    if (error) throw error
    const batch = (data ?? []) as unknown as Visit[]
    visits.push(...batch.filter(isPublicVisit))
    if (batch.length < pageSize) return { visits, truncated: false }
  }
  return { visits, truncated: true }
}

export function renderStatsShell(container: HTMLElement, active: StatsPeriod = '30d'): void {
  const periods: Array<[StatsPeriod, string]> = [['today', 'Сегодня'], ['yesterday', 'Вчера'], ['7d', '7 дней'], ['30d', '30 дней'], ['all', 'Всё время']]
  container.innerHTML = `
    <section class="admin-panel stats-panel">
      <div class="stats-header"><div><p class="admin-section-number">Посещения сайта</p><h3>Аналитика Supabase</h3><p>Онлайн считается по активности за последние 5 минут. Посещения администраторов не учитываются.</p></div></div>
      <div class="stats-controls" aria-label="Период статистики">
        <div class="stats-periods" role="group">${periods.map(([value, label]) => `<button type="button" data-stats-period="${value}" class="${value === active ? 'is-active' : ''}" aria-pressed="${value === active}">${label}</button>`).join('')}</div>
        <button type="button" class="admin-secondary" id="refresh-stats">Обновить</button>
      </div>
      <p class="stats-current-period">Показатели за период: <strong id="stats-period-name">—</strong></p>
      <div class="stats-grid">
        <article><span>Сегодня</span><strong id="stats-today">—</strong><small>просмотров</small></article>
        <article><span>За период</span><strong id="stats-period-total">—</strong><small>просмотров</small></article>
        <article><span>Уникальные</span><strong id="stats-unique">—</strong><small>посетители</small></article>
        <article><span>Сейчас онлайн</span><strong id="stats-online">—</strong><small>последние 5 минут</small></article>
        <article><span>Новые</span><strong id="stats-new">—</strong><small>посетители</small></article>
        <article><span>Постоянные</span><strong id="stats-returning">—</strong><small>посетители</small></article>
        <article><span>Отказы</span><strong id="stats-bounces">—</strong><small>одна страница</small></article>
        <article><span>Процент отказов</span><strong id="stats-bounce-rate">—</strong><small>от всех сессий</small></article>
        <article><span>Страниц смотрели</span><strong id="stats-pages-viewed">—</strong><small>уникальные адреса</small></article>
      </div>
      <p class="stats-summary" id="stats-pages-summary">Загружаем данные…</p>
      <section class="stats-chart-wrap"><h4 id="stats-chart-title">Динамика посещений</h4><div class="stats-chart" id="stats-chart" aria-label="График посещений"></div></section>
      <div class="stats-columns">
        <section><h4>Популярные страницы</h4><div class="stats-table" id="stats-pages-list"></div></section>
        <section><h4>Страны</h4><div class="stats-table" id="stats-countries"></div></section>
        <section><h4>Источники переходов</h4><div class="stats-table" id="stats-referrers"></div></section>
        <section><h4>Входные страницы</h4><div class="stats-table" id="stats-entry-pages"></div></section>
        <section><h4>Устройства</h4><div class="stats-table" id="stats-devices"></div></section>
        <section><h4>Языки браузера</h4><div class="stats-table" id="stats-browser-languages"></div></section>
        <section class="stats-wide"><h4>Последние посещения</h4><div class="stats-table" id="stats-recent"></div></section>
      </div>
      <p class="admin-help">Адреса <code>/admin/</code> и просмотры из авторизованной администраторской сессии исключаются из сбора. Статистика хранит анонимные технические идентификаторы, код страны и общие сведения браузера без IP-адреса.</p>
    </section>`
}

export async function loadStats(client: SupabaseClient, root: HTMLElement, setStatus: (message: string, error?: boolean) => void, period: StatsPeriod = '30d'): Promise<void> {
  const sequence = ++loadSequence
  const refresh = root.querySelector<HTMLButtonElement>('#refresh-stats')
  if (refresh) refresh.disabled = true
  root.querySelectorAll<HTMLButtonElement>('[data-stats-period]').forEach((button) => {
    const selected = button.dataset.statsPeriod === period
    button.classList.toggle('is-active', selected)
    button.setAttribute('aria-pressed', String(selected))
    button.disabled = true
  })
  setStatus('Загружаем статистику…')

  let result: { visits: Visit[]; truncated: boolean }
  try { result = await fetchAllVisits(client) } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка'
    setStatus(`Не удалось загрузить статистику: ${message}`, true)
    if (refresh) refresh.disabled = false
    root.querySelectorAll<HTMLButtonElement>('[data-stats-period]').forEach((button) => { button.disabled = false })
    return
  }
  if (sequence !== loadSequence) return

  const allVisits = result.visits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  const range = rangeFor(period)
  const visits = periodVisits(allVisits, range)
  const today = periodVisits(allVisits, rangeFor('today'))
  const onlineStart = Date.now() - 5 * 60 * 1000
  const online = new Set(allVisits.filter((visit) => new Date(visit.created_at).getTime() >= onlineStart).map(identity))
  const identities = new Set(visits.map(identity))
  const pages = new Map<string, number>()
  const countries = new Map<string, number>()
  const referrers = new Map<string, number>()
  const entryPages = new Map<string, number>()
  const devices = new Map<string, number>()
  const browserLanguages = new Map<string, number>()
  const sessions = new Map<string, Visit[]>()

  visits.forEach((visit, index) => {
    const page = visit.page_path || visit.page_key || '—'
    pages.set(page, (pages.get(page) ?? 0) + 1)
    const country = countryName(visit.country_code)
    countries.set(country, (countries.get(country) ?? 0) + 1)
    const source = sourceName(visit.referrer)
    referrers.set(source, (referrers.get(source) ?? 0) + 1)
    const device = deviceName(visit.device_type)
    devices.set(device, (devices.get(device) ?? 0) + 1)
    const browserLanguage = visit.browser_language || 'Не определено'
    browserLanguages.set(browserLanguage, (browserLanguages.get(browserLanguage) ?? 0) + 1)
    const session = sessionIdentity(visit, index)
    const sessionVisits = sessions.get(session) ?? []
    sessionVisits.push(visit)
    sessions.set(session, sessionVisits)
  })

  sessions.forEach((sessionVisits) => {
    const first = sessionVisits.reduce((earliest, visit) => new Date(visit.created_at) < new Date(earliest.created_at) ? visit : earliest)
    const page = first.page_path || first.page_key || '—'
    entryPages.set(page, (entryPages.get(page) ?? 0) + 1)
  })

  const globalIdentityData = new Map<string, { first: number; sessions: Set<string> }>()
  allVisits.forEach((visit, index) => {
    const key = identity(visit, index)
    const current = globalIdentityData.get(key) ?? { first: Number.POSITIVE_INFINITY, sessions: new Set<string>() }
    current.first = Math.min(current.first, new Date(visit.created_at).getTime())
    current.sessions.add(sessionIdentity(visit, index))
    globalIdentityData.set(key, current)
  })
  let returning = 0
  identities.forEach((key) => {
    const data = globalIdentityData.get(key)
    const seenBefore = Boolean(range.start && data && data.first < range.start.getTime())
    if (seenBefore || (data?.sessions.size ?? 0) > 1) returning += 1
  })
  const newcomers = Math.max(0, identities.size - returning)
  const bounces = Array.from(sessions.values()).filter((sessionVisits) => sessionVisits.length === 1).length
  const bounceRate = sessions.size ? Math.round(bounces / sessions.size * 100) : 0

  const setText = (id: string, value: string) => { const element = root.querySelector<HTMLElement>(`#${id}`); if (element) element.textContent = value }
  setText('stats-period-name', range.label)
  setText('stats-today', String(today.length))
  setText('stats-period-total', String(visits.length))
  setText('stats-unique', String(identities.size))
  setText('stats-online', String(online.size))
  setText('stats-new', String(newcomers))
  setText('stats-returning', String(returning))
  setText('stats-bounces', String(bounces))
  setText('stats-bounce-rate', `${bounceRate}%`)
  setText('stats-pages-viewed', String(pages.size))
  setText('stats-pages-summary', `${range.label}: ${visits.length} просмотров, ${identities.size} уникальных посетителей и ${sessions.size} сессий.${result.truncated ? ` Показаны последние ${maximumVisits.toLocaleString('ru-RU')} записей.` : ''}`)

  const chartData = chartBuckets(visits, period, range, allVisits)
  setText('stats-chart-title', chartData.title)
  const chart = root.querySelector<HTMLElement>('#stats-chart')
  if (chart) {
    chart.style.setProperty('--bars', String(Math.max(chartData.buckets.length, 1)))
    const max = Math.max(...chartData.buckets.map((bucket) => bucket.value), 1)
    const labelEvery = chartData.buckets.length > 40 ? Math.ceil(chartData.buckets.length / 12) : chartData.buckets.length > 14 ? 5 : 1
    chart.innerHTML = chartData.buckets.length ? chartData.buckets.map((bucket, index) => `
      <div class="stats-day" title="${escapeHtml(bucket.label)}: ${bucket.value}"><i style="--height:${Math.max(bucket.value ? 8 : 2, Math.round(bucket.value / max * 100))}%"></i><span>${index % labelEvery === 0 || index === chartData.buckets.length - 1 ? escapeHtml(bucket.label) : ''}</span></div>`).join('') : '<p class="admin-empty">За выбранный период посещений нет.</p>'
  }

  const targets: Array<[string, Map<string, number>, string]> = [
    ['stats-pages-list', pages, 'Посещений пока нет.'],
    ['stats-countries', countries, 'Данных пока нет.'],
    ['stats-referrers', referrers, 'Данных пока нет.'],
    ['stats-entry-pages', entryPages, 'Данных пока нет.'],
    ['stats-devices', devices, 'Данных пока нет.'],
    ['stats-browser-languages', browserLanguages, 'Данных пока нет.'],
  ]
  targets.forEach(([id, values, empty]) => { const element = root.querySelector<HTMLElement>(`#${id}`); if (element) element.innerHTML = rows(values, empty) })

  const recent = root.querySelector<HTMLElement>('#stats-recent')
  if (recent) recent.innerHTML = visits.length ? visits.slice(0, 14).map((visit) => {
    const detail = [countryName(visit.country_code), deviceName(visit.device_type), visit.browser_name || 'Браузер не определён'].join(' · ')
    return `<div class="stats-row stats-recent"><div><span>${escapeHtml(visit.page_path || visit.page_key)}</span><small>${escapeHtml(detail)}</small></div><strong>${escapeHtml(formatDate(visit.created_at))}</strong></div>`
  }).join('') : '<p class="admin-empty">Посещений пока нет.</p>'

  if (refresh) refresh.disabled = false
  root.querySelectorAll<HTMLButtonElement>('[data-stats-period]').forEach((button) => { button.disabled = false })
  setStatus(`Статистика обновлена: ${formatDate(new Date().toISOString())}.`)
}
