export const CONFIG = {
  API_BASE_URL: 'https://ark-api.aciso-suite.com/api/v1',
  BOOKING_API_URL: 'https://ark-api.aciso-suite.com/api/v1/courseplan_course_joiners',
  API_AUTH_TOKEN: process.env.API_AUTH_TOKEN || '',
  BOOKING_AUTH_TOKEN: process.env.BOOKING_AUTH_TOKEN || '',
  CENTER_ID: parseInt(process.env.CENTER_ID || '27'),
  DOMAIN: process.env.DOMAIN || 'https://www.injoy-wolfsburg.de',
  TEST_MODE: false,

  // Paid-Tier Infrastruktur — solange FREE_MODE=true, werden keine Credits
  // abgezogen und Auto-Book ist für alle kostenlos.
  FREE_MODE: process.env.FREE_MODE !== 'false',
  FREE_MODE_CREDITS: 999,

  // Stripe (Platzhalter, erst aktiv wenn FREE_MODE=false)
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // Supabase / Postgres (Platzhalter)
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}
