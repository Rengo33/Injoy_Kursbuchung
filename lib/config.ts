// API Configuration
export const CONFIG = {
  API_BASE_URL: 'https://ark-api.aciso-suite.com/api/v1',
  BOOKING_API_URL: 'https://ark-api.aciso-suite.com/api/v1/courseplan_course_joiners',
  API_AUTH_TOKEN: process.env.API_AUTH_TOKEN || '',
  BOOKING_AUTH_TOKEN: process.env.BOOKING_AUTH_TOKEN || '',
  CENTER_ID: parseInt(process.env.CENTER_ID || '27'),
  DOMAIN: process.env.DOMAIN || 'https://www.injoy-wolfsburg.de',
  TEST_MODE: false, // Schedule bookings 1 minute ahead for testing
}
