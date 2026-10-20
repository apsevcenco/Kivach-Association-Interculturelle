import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from './i18n'
import type { Page } from './templates'

const sessionKey = 'kivach-visit-session-v1'
const visitorKey = 'kivach-visitor-v1'

function sessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(sessionKey)
    if (existing) return existing
    const created = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.sessionStorage.setItem(sessionKey, created)
    return created
  } catch {
    return ''
  }
}

function visitorId(): string {
  try {
    const existing = window.localStorage.getItem(visitorKey)
    if (existing) return existing
    const created = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem(visitorKey, created)
    return created
  } catch {
    return sessionId()
  }
}

function externalReferrer(): string {
  if (!document.referrer) return ''
  try {
    const referrer = new URL(document.referrer)
    return referrer.hostname === window.location.hostname ? 'internal' : referrer.hostname.slice(0, 160)
  } catch {
    return ''
  }
}

function deviceType(): 'mobile' | 'tablet' | 'desktop' {
  const agent = navigator.userAgent.toLowerCase()
  if (/ipad|tablet|kindle|silk/.test(agent) || (/android/.test(agent) && !/mobile/.test(agent))) return 'tablet'
  if (/mobile|iphone|ipod|android/.test(agent)) return 'mobile'
  return 'desktop'
}

function browserName(): string {
  const agent = navigator.userAgent
  if (/Edg\//.test(agent)) return 'Edge'
  if (/OPR\//.test(agent)) return 'Opera'
  if (/Firefox\//.test(agent)) return 'Firefox'
  if (/Chrome\//.test(agent) || /CriOS\//.test(agent)) return 'Chrome'
  if (/Safari\//.test(agent)) return 'Safari'
  return 'Не определено'
}

export async function trackPageVisit(client: SupabaseClient, page: Page, locale: Locale): Promise<void> {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname) || /^\/(?:[a-z]{2}\/)?admin(?:\/|$)/i.test(window.location.pathname)) return
  try {
    const { data } = await client.auth.getSession()
    if (data.session) return
  } catch { /* If auth storage is unavailable, continue without blocking the site. */ }
  const visit = {
    page_key: page,
    page_path: window.location.pathname.slice(0, 300),
    language: locale,
    session_id: sessionId().slice(0, 120) || null,
    visitor_id: visitorId().slice(0, 120) || null,
    referrer: externalReferrer() || null,
    device_type: deviceType(),
    browser_name: browserName().slice(0, 80),
    browser_language: (navigator.language || '').slice(0, 35) || null,
  }
  try {
    const endpoint = import.meta.env.VITE_TRANSLATION_API_URL?.trim().replace(/\/$/, '')
    if (endpoint) {
      const response = await fetch(`${endpoint}/track`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(visit), keepalive: true,
      })
      if (response.ok) return
    }
    await client.from('page_visits').insert(visit)
  } catch {
    // Audience measurement must never block the public site.
  }
}
