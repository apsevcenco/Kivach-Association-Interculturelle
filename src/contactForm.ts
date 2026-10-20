import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from './i18n'

type FormCopy = { sending: string; success: string; error: string; unavailable: string; wait: string }

const copy: Record<Locale, FormCopy> = {
  fr: { sending: 'Envoi en cours…', success: 'Merci. Votre message a bien été envoyé.', error: 'Le message n’a pas pu être envoyé. Veuillez réessayer.', unavailable: 'La messagerie est temporairement indisponible.', wait: 'Veuillez patienter un instant avant un nouvel envoi.' },
  en: { sending: 'Sending…', success: 'Thank you. Your message has been sent.', error: 'The message could not be sent. Please try again.', unavailable: 'Messaging is temporarily unavailable.', wait: 'Please wait a moment before sending another message.' },
  ru: { sending: 'Отправляем…', success: 'Спасибо. Ваше сообщение отправлено.', error: 'Не удалось отправить сообщение. Попробуйте ещё раз.', unavailable: 'Форма временно недоступна.', wait: 'Пожалуйста, подождите немного перед повторной отправкой.' },
  de: { sending: 'Wird gesendet…', success: 'Vielen Dank. Ihre Nachricht wurde gesendet.', error: 'Die Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.', unavailable: 'Das Kontaktformular ist vorübergehend nicht verfügbar.', wait: 'Bitte warten Sie einen Moment, bevor Sie erneut senden.' },
  it: { sending: 'Invio in corso…', success: 'Grazie. Il messaggio è stato inviato.', error: 'Non è stato possibile inviare il messaggio. Riprova.', unavailable: 'Il modulo è temporaneamente non disponibile.', wait: 'Attendi un momento prima di inviare un altro messaggio.' },
  ar: { sending: 'جارٍ الإرسال…', success: 'شكرًا لك. تم إرسال رسالتك.', error: 'تعذّر إرسال الرسالة. يُرجى المحاولة مرة أخرى.', unavailable: 'نموذج التواصل غير متاح مؤقتًا.', wait: 'يُرجى الانتظار قليلًا قبل إرسال رسالة أخرى.' },
  es: { sending: 'Enviando…', success: 'Gracias. Tu mensaje ha sido enviado.', error: 'No se pudo enviar el mensaje. Inténtalo de nuevo.', unavailable: 'El formulario no está disponible temporalmente.', wait: 'Espera un momento antes de enviar otro mensaje.' },
}

const cooldownKey = 'kivach-contact-last-submit'
const cooldown = 30_000

function showStatus(element: HTMLElement, message: string, error = false): void {
  element.textContent = message
  element.classList.toggle('is-error', error)
}

export function setupContactForm(client: SupabaseClient | null, locale: Locale): void {
  const form = document.querySelector<HTMLFormElement>('#contact-form')
  const status = document.querySelector<HTMLElement>('#contact-status')
  if (!form || !status) return
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  const messages = copy[locale]

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form.reportValidity()) return
    const data = new FormData(form)
    if (String(data.get('website') ?? '').trim()) {
      form.reset()
      showStatus(status, messages.success)
      return
    }
    if (!client) {
      showStatus(status, messages.unavailable, true)
      return
    }
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim().toLowerCase()
    const message = String(data.get('message') ?? '').trim()
    let lastSubmission = 0
    try { lastSubmission = Number(window.localStorage.getItem(cooldownKey)) || 0 } catch { /* Storage may be unavailable. */ }
    if (Date.now() - lastSubmission < cooldown) {
      showStatus(status, messages.wait, true)
      return
    }

    if (button) button.disabled = true
    showStatus(status, messages.sending)
    const { error } = await client.from('contact_messages').insert({
      name,
      email,
      message,
      language: locale,
      page_path: window.location.pathname.slice(0, 300),
    })
    if (button) button.disabled = false
    if (error) {
      console.warn('Contact message could not be saved:', error.message)
      showStatus(status, messages.error, true)
      return
    }
    try { window.localStorage.setItem(cooldownKey, String(Date.now())) } catch { /* Storage may be unavailable. */ }
    form.reset()
    showStatus(status, messages.success)
  })
}
