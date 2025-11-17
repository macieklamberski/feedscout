export type FetchFnOptions = {
  method?: 'GET' | 'HEAD'
  headers?: Record<string, string>
}

export type FetchFnResponse = {
  headers: Headers
  body: string | ReadableStream<Uint8Array>
  url: string
  status: number
  statusText: string
}

export type FetchFn = (url: string, options?: FetchFnOptions) => Promise<FetchFnResponse>

export type Progress = {
  tested: number
  total: number
  found: number
  current: string
}

export type Result =
  | { url: string; isFeed: true; feedFormat: 'rss' | 'atom' | 'json' | 'rdf' }
  | { url: string; isFeed: false }

export type ValidatorFn = (response: FetchFnResponse) => Promise<Result>

export type Options = {
  fetchFn: FetchFn
  feedUris?: Array<string>
  validateFn?: ValidatorFn
  concurrency?: number
  stopOnFirst?: boolean
  includeInvalid?: boolean
  onProgress?: (progress: Progress) => void
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
