export type Options = {
  baseUrl: string
  feedUris?: Array<string>
  /**
   * Additional base URLs to test alongside the main baseUrl.
   * Useful for testing subdomain variants (e.g., www, blog, feeds).
   *
   * @example
   * ```typescript
   * import { getWwwCounterpart, getSubdomainVariants } from 'feedscout/guess'
   *
   * // Test www variant
   * additionalBaseUrls: getWwwCounterpart('https://example.com')
   *
   * // Test multiple subdomains
   * additionalBaseUrls: getSubdomainVariants('https://example.com', ['blog', 'feeds'])
   *
   * // Mix helpers and explicit URLs
   * additionalBaseUrls: [
   *   ...getWwwCounterpart(baseUrl),
   *   'https://custom.example.com'
   * ]
   * ```
   */
  additionalBaseUrls?: Array<string>
}
