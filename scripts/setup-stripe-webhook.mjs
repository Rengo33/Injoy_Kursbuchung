#!/usr/bin/env node
/**
 * Legt den Stripe-Webhook für Production in Vercel an und gibt das
 * Signing-Secret aus. Idempotent — falls die URL schon existiert, wird
 * sie gelöscht und neu angelegt (Secret kann von Stripe nur beim Create
 * zurückgegeben werden).
 *
 * Aufruf:
 *   node scripts/setup-stripe-webhook.mjs <production-url>
 *
 * z.B.:
 *   node scripts/setup-stripe-webhook.mjs https://injoy-kursbuchung.vercel.app
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_PATH = path.join(ROOT, '.env.local')

function loadEnv() {
  const raw = fs.readFileSync(ENV_PATH, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const siteUrl = process.argv[2]
if (!siteUrl) {
  console.error('Usage: node scripts/setup-stripe-webhook.mjs <production-url>')
  process.exit(1)
}

const webhookUrl = `${siteUrl.replace(/\/$/, '')}/api/stripe/webhook`

const env = loadEnv()
const secret = env.STRIPE_SECRET_KEY
if (!secret) {
  console.error('STRIPE_SECRET_KEY fehlt in .env.local')
  process.exit(1)
}

const stripe = new Stripe(secret, { apiVersion: '2026-03-25.dahlia' })

async function main() {
  console.log(`▶ Stripe-Webhook für ${webhookUrl}`)
  console.log(`  Account: ${secret.startsWith('sk_test_') ? 'TEST/Sandbox' : 'LIVE'}`)
  console.log('')

  const existing = await stripe.webhookEndpoints.list({ limit: 100 })
  for (const ep of existing.data) {
    if (ep.url === webhookUrl) {
      console.log(`  · Lösche existierenden Endpoint ${ep.id}`)
      await stripe.webhookEndpoints.del(ep.id)
    }
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: ['checkout.session.completed'],
    description: 'Injoy Kursbuchung — Production',
  })

  console.log('  ✓ Webhook erstellt')
  console.log(`    ID:       ${endpoint.id}`)
  console.log(`    URL:      ${endpoint.url}`)
  console.log(`    Events:   ${endpoint.enabled_events.join(', ')}`)
  console.log('')
  console.log('  Signing Secret (in Vercel als STRIPE_WEBHOOK_SECRET eintragen):')
  console.log('')
  console.log(`    ${endpoint.secret}`)
  console.log('')
}

main().catch(err => {
  console.error('Fehler:', err.message)
  process.exit(1)
})
