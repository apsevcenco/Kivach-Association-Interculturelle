import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from './i18n'
import type { Page } from './templates'

const sessionKey = 'kivach-visit-session-v1'

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

function externalReferrer(): string {
  if (!document.referrer) return ''
  try {
    const referrer = new URL(document.referrer)
    return referrer.hostname === window.location.hostname ? '' : referrer.hostname.slice(0, 160)
  } catch {
    return ''
  }
}

export async function trackPageVisit(client: SupabaseClient, page: Page, locale: Locale): Promise<void> {
  if (['localhost', '127.0.0.1'].includes(window.location.hostname)) return
  const visit = {
    page_key: page,
    page_path: window.location.pathname.slice(0, 300),
    language: locale,
    session_id: sessionId().slice(0, 120) || null,
    referrer: externalReferrer() || null,
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
