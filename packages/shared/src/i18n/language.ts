export function getCurrentLocale () {
  // Support override with LOCALE env
  if (typeof process !== 'undefined' && 'env' in process && 'LANG' in process.env) {
    return process.env.LOCALE
  }
  // Node 21.3+
  if (typeof navigator !== 'undefined' && 'language' in navigator) {
    return navigator.language
  }
  // Fallback to Intl.DateTimeFormat
  const locale = Intl.DateTimeFormat().resolvedOptions().locale
  return locale
}
