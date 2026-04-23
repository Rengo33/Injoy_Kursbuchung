export const CONFIG = {
  // Externe INJOY / ACISO API
  API_BASE_URL: 'https://ark-api.aciso-suite.com/api/v1',
  BOOKING_API_URL: 'https://ark-api.aciso-suite.com/api/v1/courseplan_course_joiners',
  API_AUTH_TOKEN: process.env.API_AUTH_TOKEN || '',
  BOOKING_AUTH_TOKEN: process.env.BOOKING_AUTH_TOKEN || '',
  CENTER_ID: parseInt(process.env.CENTER_ID || '27'),
  DOMAIN: process.env.DOMAIN || 'https://www.injoy-wolfsburg.de',
  TEST_MODE: false,

  // App
  APP_URL: process.env.APP_URL || '',

  // Scheduler (QStash)
  QSTASH_TOKEN: process.env.QSTASH_TOKEN || '',
  SCHEDULER_SECRET: process.env.SCHEDULER_SECRET || '',

  // Paid-Tier
  FREE_MODE: process.env.FREE_MODE !== 'false',
  FREE_MODE_CLIENT: process.env.NEXT_PUBLIC_FREE_MODE !== 'false',
  FREE_MODE_CREDITS: 999,

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_SINGLE: process.env.STRIPE_PRICE_SINGLE || '',
  STRIPE_PRICE_BUNDLE: process.env.STRIPE_PRICE_BUNDLE || '',
  STRIPE_PRICE_UNLIMITED: process.env.STRIPE_PRICE_UNLIMITED || '',

  // Supabase
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}
