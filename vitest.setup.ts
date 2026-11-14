try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: database tests are skipped unless DATABASE_URL is set.
}
process.env.MOBILE_ID_DELAY_MS = "0";
