'use client'

import { useEffect, useState } from 'react'

const DISMISS_KEY = 'b24_app_banner_dismissed_at'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 Tage
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=de.bereifung24.bereifung24_app'
const APP_STORE_URL = 'https://apps.apple.com/de/app/bereifung24/id6761443270'

type Platform = 'android' | 'ios' | null

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return null
  const ua = navigator.userAgent || ''
  if (/android/i.test(ua)) return 'android'
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios'
  return null
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // Already running as installed PWA / inside the native app webview
  // @ts-expect-error iOS Safari property
  if (window.navigator.standalone) return true
  if (window.matchMedia?.('(display-mode: standalone)').matches) return true
  return false
}

export default function AppInstallBanner() {
  const [platform, setPlatform] = useState<Platform>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone()) return
    const p = detectPlatform()
    if (!p) return

    // iOS: Safari rendert den nativen Smart App Banner via meta-tag
    // → eigenen Banner nur für Android anzeigen
    if (p === 'ios') return

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY)
      if (dismissedAt) {
        const ts = parseInt(dismissedAt, 10)
        if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_DURATION_MS) {
          return
        }
      }
    } catch {
      /* localStorage blocked → trotzdem anzeigen */
    }

    setPlatform(p)
    setShow(true)
  }, [])

  function dismiss() {
    setShow(false)
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString())
    } catch {
      /* ignore */
    }
  }

  if (!show || !platform) return null

  const storeUrl = platform === 'android' ? PLAY_STORE_URL : APP_STORE_URL

  return (
    <div
      role="dialog"
      aria-label="Bereifung24 App installieren"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[env(safe-area-inset-bottom)] sm:px-4"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
        <img
          src="/apple-touch-icon.png"
          alt="Bereifung24"
          width={48}
          height={48}
          className="h-12 w-12 flex-shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-gray-900">
            Bereifung24 App
          </div>
          <div className="truncate text-xs text-gray-600">
            Werkstatt-Termine & Reifenservice in der App
          </div>
        </div>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="rounded-full bg-[#0284C7] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0369A1]"
        >
          Öffnen
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Schließen"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  )
}
