'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CreditStatus } from './credits'
import { useAuth } from '@/components/AuthProvider'

const DEMO_FLAG_KEY = 'injoy_demo_paid'
const DEMO_CREDITS_KEY = 'injoy_demo_credits'
const DEMO_EVENT = 'injoy:demo-change'
const CREDITS_REFRESH_EVENT = 'injoy:credits-refresh'

export function refreshCredits() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CREDITS_REFRESH_EVENT))
}

function nextRefillLabel(): string {
  const d = new Date()
  const first = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  return first.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

const DEMO_MONTHLY = 10
const DEMO_INITIAL_CREDITS = 3

export function isServerPaidMode(): boolean {
  return process.env.NEXT_PUBLIC_FREE_MODE === 'false'
}

function readFlag(): boolean {
  if (typeof window === 'undefined') return false
  // Wenn Server bereits im echten Paid-Mode läuft, ist Demo sinnlos — immer ignorieren.
  if (isServerPaidMode()) {
    if (localStorage.getItem(DEMO_FLAG_KEY) === '1') {
      localStorage.removeItem(DEMO_FLAG_KEY)
    }
    return false
  }
  return localStorage.getItem(DEMO_FLAG_KEY) === '1'
}

function readCredits(): number {
  if (typeof window === 'undefined') return DEMO_INITIAL_CREDITS
  const v = localStorage.getItem(DEMO_CREDITS_KEY)
  return v === null ? DEMO_INITIAL_CREDITS : Math.max(0, parseInt(v, 10) || 0)
}

function writeCredits(n: number) {
  localStorage.setItem(DEMO_CREDITS_KEY, String(Math.max(0, n)))
  window.dispatchEvent(new Event(DEMO_EVENT))
}

export function isDemoPaid(): boolean {
  return readFlag()
}

export function getDemoCredits(): number {
  return readCredits()
}

export function setDemoCredits(n: number) {
  writeCredits(n)
}

export function addDemoCredits(delta: number) {
  writeCredits(readCredits() + delta)
}

export function consumeDemoCredit(): boolean {
  const current = readCredits()
  if (current <= 0) return false
  writeCredits(current - 1)
  return true
}

export function togglePaidPreview() {
  if (isServerPaidMode()) return // no-op im echten Paid-Modus
  const next = !readFlag()
  if (next) {
    localStorage.setItem(DEMO_FLAG_KEY, '1')
    if (localStorage.getItem(DEMO_CREDITS_KEY) === null) {
      localStorage.setItem(DEMO_CREDITS_KEY, String(DEMO_INITIAL_CREDITS))
    }
  } else {
    localStorage.removeItem(DEMO_FLAG_KEY)
  }
  window.dispatchEvent(new Event(DEMO_EVENT))
}

export interface CreditsHookResult {
  credits: CreditStatus | null
  isPaidPreview: boolean
  loading: boolean
}

export function useCredits(): CreditsHookResult {
  const { user } = useAuth()
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [isPaidPreview, setPaid] = useState(false)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(() => {
    const paid = readFlag()
    setPaid(paid)
    if (paid) {
      setCredits({
        credits: readCredits(),
        monthlyAllowance: DEMO_MONTHLY,
        nextRefill: nextRefillLabel(),
        freeMode: false,
      })
      setLoading(false)
    } else {
      setLoading(true)
      fetch('/api/user/credits')
        .then(r => (r.ok ? r.json() : null))
        .then(data => { if (data) setCredits(data) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [])

  useEffect(() => {
    compute()
    const handler = () => compute()
    window.addEventListener(DEMO_EVENT, handler)
    window.addEventListener(CREDITS_REFRESH_EVENT, handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener(DEMO_EVENT, handler)
      window.removeEventListener(CREDITS_REFRESH_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [compute, user?.id])

  return { credits, isPaidPreview, loading }
}
