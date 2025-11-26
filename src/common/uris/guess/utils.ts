export const generateUrlCombinations = (
  baseUrls: Array<string>,
  uris: Array<string>,
): Array<string> => {
  return baseUrls.flatMap((base) => {
    return uris.map((uri) => {
      return new URL(uri, base).toString()
    })
  })
}

/**
 * Get the www/non-www counterpart of a URL.
 *
 * - If URL is `example.com`, returns `['www.example.com']`
 * - If URL is `www.example.com`, returns `['example.com']`
 *
 * @param baseUrl - The base URL to get the counterpart for
 * @returns Array with single www/non-www counterpart URL
 *
 * @example
 * ```typescript
 * getWwwCounterpart('https://example.com')
 * // → ['https://www.example.com']
 *
 * getWwwCounterpart('https://www.example.com')
 * // → ['https://example.com']
 * ```
 */
export const getWwwCounterpart = (baseUrl: string): Array<string> => {
  const url = new URL(baseUrl)
  const counterpart = new URL(url)

  // Remove www.
  if (url.hostname.startsWith('www.')) {
    counterpart.hostname = url.hostname.replace(/^www\./, '')
    return [counterpart.origin]
  }

  // Add www.
  counterpart.hostname = `www.${url.hostname}`
  return [counterpart.origin]
}

/**
 * Generate subdomain variants by applying prefixes to the root domain.
 *
 * Extracts the root domain from the base URL and applies each prefix.
 * Uses a simple heuristic: takes the last two parts of the hostname as root domain.
 *
 * **Limitations:**
 * - Multi-level TLDs not supported (e.g., .co.uk, .edu.us). For `example.co.uk`,
 *   will incorrectly extract `co.uk` as root domain.
 * - IP detection is basic (IPv4 only). IPv6 addresses may not be detected correctly.
 * - For complex domains, use explicit URLs via `additionalBaseUrls` option instead.
 *
 * @param baseUrl - The base URL to generate variants for
 * @param prefixes - Array of subdomain prefixes (e.g., ['blog', 'feeds', 'news'])
 * @returns Array of subdomain variant URLs
 *
 * @example
 * ```typescript
 * getSubdomainVariants('https://example.com', ['blog', 'feeds'])
 * // → ['https://blog.example.com', 'https://feeds.example.com']
 *
 * getSubdomainVariants('https://www.example.com', ['blog', 'feeds'])
 * // → ['https://blog.example.com', 'https://feeds.example.com']
 *
 * // Empty prefix returns root domain
 * getSubdomainVariants('https://www.example.com', [''])
 * // → ['https://example.com']
 *
 * // For multi-level TLDs, use explicit URLs instead:
 * // ❌ getSubdomainVariants('https://example.co.uk', ['blog'])
 * // ✅ additionalBaseUrls: ['https://blog.example.co.uk']
 * ```
 */
export const getSubdomainVariants = (baseUrl: string, prefixes: Array<string>): Array<string> => {
  const url = new URL(baseUrl)
  const hostname = url.hostname

  // Check if hostname is an IP address (simple check for digits and dots)
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostname)

  // Handle edge cases: localhost, IPs
  if (hostname === 'localhost' || isIpAddress) {
    return []
  }

  const hostnameParts = hostname.split('.')

  // Need at least 2 parts for a domain
  if (hostnameParts.length < 2) {
    return []
  }

  // Extract root domain (last two parts: example.com)
  const rootDomain = hostnameParts.slice(-2).join('.')
  const protocol = url.protocol
  const port = url.port ? `:${url.port}` : ''

  return prefixes.map((prefix) => {
    const hostname = prefix === '' ? rootDomain : `${prefix}.${rootDomain}`
    return `${protocol}//${hostname}${port}`
  })
}
