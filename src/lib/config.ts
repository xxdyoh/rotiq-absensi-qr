export const config = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8086',
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Web Absensi',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  ENABLE_QR_SCANNER: process.env.NEXT_PUBLIC_ENABLE_QR_SCANNER === 'true',
  ENABLE_LOCATION_CHECK: process.env.NEXT_PUBLIC_ENABLE_LOCATION_CHECK === 'true',
};