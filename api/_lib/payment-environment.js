/**
 * Resolves the active payment environment ('test' or 'live') based on process.env.PAYMENT_ENV.
 * If the environment variable is missing, it falls back to the database-configured mode for backward compatibility.
 * Throws a clear configuration error if the environment variable is configured with an invalid value.
 * 
 * @param {string|null} fallbackDbMode The mode configured in the website_settings database row.
 * @returns {'test' | 'live'}
 */
export function getPaymentEnvironment(fallbackDbMode) {
  // Force 'live' mode in production / deployed versions
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {
    return 'live';
  }

  const envValue = process.env.PAYMENT_ENV;

  if (envValue === undefined || envValue === null || envValue === '') {
    const resolvedMode = fallbackDbMode || 'test';
    if (resolvedMode !== 'test' && resolvedMode !== 'live') {
      throw new Error(`Invalid fallback payment mode resolved from database: "${resolvedMode}". Must be "test" or "live".`);
    }
    return resolvedMode;
  }

  const trimmedEnv = envValue.trim();
  if (trimmedEnv === 'test') {
    return 'test';
  } else if (trimmedEnv === 'live') {
    return 'live';
  } else {
    throw new Error(`[Configuration Error] Invalid PAYMENT_ENV value: "${trimmedEnv}". Allowed values are "test" or "live".`);
  }
}
