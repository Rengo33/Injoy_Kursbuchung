#!/usr/bin/env node
/**
 * Einmal-Skript: legt in Stripe die 3 Credit-Produkte an und schreibt die
 * Price-IDs in .env.local. Idempotent — erkennt existierende Produkte anhand
 * der Metadata `app=injoy` + `tier=<id>`.
 *
 * Ausführung:
 *   node scripts/setup-stripe.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Stripe from 'stripe'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_PATH = path.join(ROOT, '.env.local')

// .env.local parsen
function loadEnv() {
  const raw = fs.readFileSync(ENV_PATH, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

function writeEnvVars(vars) {
  let raw = fs.readFileSync(ENV_PATH, 'utf8')
  for (const [k, v] of Object.entries(vars)) {
    const re = new RegExp(`^${k}=.*$`, 'm')
    if (re.test(raw)) {
      raw = raw.replace(re, `${k}=${v}`)
    } else {
      raw = raw.trimEnd() + `\n${k}=${v}\n`
    }
  }
  fs.writeFileSync(ENV_PATH, raw)
}

const env = loadEnv()
const secret = env.STRIPE_SECRET_KEY
if (!secret) {
  console.error('Fehlt: STRIPE_SECRET_KEY in .env.local')
  process.exit(1)
}

const stripe = new Stripe(secret, { apiVersion: '2026-03-25.dahlia' })

const TIERS = [
  {
    id: 'single',
    name: 'Injoy · Einzel-Credit',
    description: '1 Auto-Book Credit. Reserviert automatisch einen Kursplatz zur Freigabe.',
    credits: '1',
    unit_amount: 199,
    currency: 'eur',
  },
  {
    id: 'bundle',
    name: 'Injoy · 10er Bündel',
    description: '10 Auto-Book Credits. 25 % günstiger als einzeln.',
    credits: '10',
    unit_amount: 1490,
    currency: 'eur',
  },
  {
    id: 'unlimited',
    name: 'Injoy · Unlimited Pack',
    description: '999 Auto-Book Credits. Effektiv unbegrenzt für den Alltag.',
    credits: '999',
    unit_amount: 990,
    currency: 'eur',
  },
]

async function findOrCreateProduct(tier) {
  const existing = await stripe.products.search({
    query: `metadata['app']:'injoy' AND metadata['tier']:'${tier.id}'`,
    limit: 1,
  })
  if (existing.data.length) {
    console.log(`  · Produkt bereits vorhanden: ${tier.id} → ${existing.data[0].id}`)
    return existing.data[0]
  }
  const product = await stripe.products.create({
    name: tier.name,
    description: tier.description,
    metadata: { app: 'injoy', tier: tier.id, credits: tier.credits },
  })
  console.log(`  ✓ Produkt erstellt: ${tier.id} → ${product.id}`)
  return product
}

async function findOrCreatePrice(tier, product) {
  const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 })
  const match = prices.data.find(
    p => p.unit_amount === tier.unit_amount && p.currency === tier.currency
  )
  if (match) {
    console.log(`  · Preis bereits vorhanden: ${tier.id} → ${match.id}`)
    return match
  }
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: tier.unit_amount,
    currency: tier.currency,
    metadata: { app: 'injoy', tier: tier.id, credits: tier.credits },
  })
  console.log(`  ✓ Preis erstellt: ${tier.id} → ${price.id}`)
  return price
}

async function main() {
  console.log('▶ Stripe-Setup für Injoy')
  console.log(`  Account: ${secret.startsWith('sk_test_') ? 'TEST/Sandbox' : 'LIVE'}`)
  console.log('')

  const priceIds = {}

  for (const tier of TIERS) {
    console.log(`· Tier: ${tier.id}`)
    const product = await findOrCreateProduct(tier)
    const price = await findOrCreatePrice(tier, product)
    priceIds[`STRIPE_PRICE_${tier.id.toUpperCase()}`] = price.id
    console.log('')
  }

  writeEnvVars(priceIds)
  console.log('✓ Preis-IDs in .env.local geschrieben:')
  for (const [k, v] of Object.entries(priceIds)) console.log(`  ${k}=${v}`)
  console.log('')
  console.log('Fertig.')
}

main().catch(err => {
  console.error('Fehler:', err.message)
  process.exit(1)
})
