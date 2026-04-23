'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CreditStatus } from './credits'
import { CONFIG } from './config'
import { nextMonthFirstLabel } from './datum'
import { useAuth } from '@/components/AuthProvider'

const DEMO_FLAG_KEY = 'injoy_demo_paid'
const DEMO_CREDITS_KEY = 'injoy_demo_credits'
const DEMO_EVENT = 'injoy:demo-change'
const CREDITS_REFRESH_EVENT = 'injoy:credits-refresh'

const DEMO_MONTHLY = 10
const DEMO_INITIAL_CREDITS = 3

export function refreshCredits() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(CREDITS_REFRESH_EVENT))
}

export function isServerPaidMode(): boolean {
  return !CONFIG.FREE_MODE_CLIENT
}

function readFlag(): boolean {
  if (typeof window === 'undefined') return false
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

export function togglePaidPreview() {
  if (isServerPaidMode()) return
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

function makeDemoStatus(): CreditStatus {
  return {
    credits: readCredits(),
    monthlyAllowance: DEMO_MONTHLY,
    nextRefill: nextMonthFirstLabel(),
    freeMode: false,
  }
}

export interface CreditsHookResult {
  credits: CreditStatus | null
  loading: boolean
  /** Verbraucht im Demo-Modus einen Credit client-seitig (nach erfolgreicher Buchung). */
  consumeIfDemo: () => void
}

export function useCredits(): CreditsHookResult {
  const { user } = useAuth()
  const [credits, setCredits] = useState<CreditStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const compute = useCallback(() => {
    if (readFlag()) {
      setCredits(makeDemoStatus())
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/user/credits')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setCredits(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
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

  const consumeIfDemo = useCallback(() => {
    if (!readFlag()) return
    const current = readCredits()
    if (current <= 0) return
    writeCredits(current - 1)
  }, [])

  return { credits, loading, consumeIfDemo }
}
