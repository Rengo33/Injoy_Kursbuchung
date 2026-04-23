import { CONFIG } from './config'
import { supabaseAdmin } from './supabase/admin'

export interface CreditStatus {
  credits: number
  monthlyAllowance: number
  nextRefill: string | null
  freeMode: boolean
}

export interface CreditCheckResult {
  ok: boolean
  reason?: 'insufficient' | 'auth_required'
  remaining?: number
}

export function makeFreeStatus(): CreditStatus {
  return {
    credits: CONFIG.FREE_MODE_CREDITS,
    monthlyAllowance: CONFIG.FREE_MODE_CREDITS,
    nextRefill: null,
    freeMode: true,
  }
}

export function makeEmptyStatus(): CreditStatus {
  return { credits: 0, monthlyAllowance: 0, nextRefill: null, freeMode: false }
}

export async function getCreditStatus(userId: string | null): Promise<CreditStatus> {
  if (CONFIG.FREE_MODE) return makeFreeStatus()
  if (!userId) return makeEmptyStatus()

  const supa = supabaseAdmin()
  const { data } = await supa
    .from('credit_balance')
    .select('credits')
    .eq('user_id', userId)
    .maybeSingle()

  const credits = data?.credits ?? 0
  return {
    credits,
    monthlyAllowance: credits,
    nextRefill: null,
    freeMode: false,
  }
}

export async function consumeCredit(
  userId: string | null,
  reason: string,
  courseId?: number
): Promise<CreditCheckResult> {
  if (CONFIG.FREE_MODE) {
    return { ok: true, remaining: CONFIG.FREE_MODE_CREDITS }
  }

  if (!userId) {
    return { ok: false, reason: 'auth_required' }
  }

  const supa = supabaseAdmin()
  const { data, error } = await supa.rpc('consume_credit', {
    p_user_id: userId,
    p_reason: reason,
    p_course_id: courseId ?? null,
  })

  if (error) {
    console.error('consume_credit rpc failed:', error)
    return { ok: false, reason: 'insufficient' }
  }

  const result = data as { ok: boolean; remaining: number }
  return result.ok
    ? { ok: true, remaining: result.remaining }
    : { ok: false, reason: 'insufficient', remaining: result.remaining }
}

export async function refundCredit(userId: string | null, reason: string): Promise<void> {
  if (CONFIG.FREE_MODE) return
  if (!userId) return

  const supa = supabaseAdmin()
  await supa.rpc('refund_credit', { p_user_id: userId, p_reason: reason })
}

export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  stripeSessionId?: string
): Promise<number> {
  const supa = supabaseAdmin()
  const { data, error } = await supa.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_reason: reason,
    p_stripe_session_id: stripeSessionId ?? null,
  })
  if (error) throw error
  return data as number
}
