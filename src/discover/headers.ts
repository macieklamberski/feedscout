import type { DiscoverFeedUrisFromHeadersOptions } from '../common/types.js'
import { isAnyOf, normalizeMimeType } from '../common/utils.js'

// RFC 8288: Web Linking - HTTP Link header field for feed discovery.
// https://www.rfc-editor.org/rfc/rfc8288

/**
 * Discovers feed URIs from HTTP Link headers (RFC 8288).
 *
 * Parses the Link header and extracts URIs with rel="alternate" and
 * feed MIME types. Returns raw URIs without any resolution or validation.
 *
 * @param headers - Native Headers object from fetch API
 * @param options - Configuration for MIME type filtering
 * @returns Array of discovered feed URIs (raw, unresolved)
 *
 * @example
 * ```typescript
 * const headers = new Headers({
 *   'Link': '</feed.xml>; rel="alternate"; type="application/rss+xml"'
 * })
 * const uris = discoverFeedUrisFromHeaders(headers, {
 *   linkMimeTypes: ['application/rss+xml', 'application/atom+xml']
 * })
 * // Returns: ['/feed.xml']
 * ```
 */
export const discoverFeedUrisFromHeaders = (
  headers: Headers,
  options: DiscoverFeedUrisFromHeadersOptions,
): Array<string> => {
  const feedUris = new Set<string>()
  const linkHeader = headers.get('link')

  if (!linkHeader) {
    return []
  }

  // Split by comma, but not commas inside angle brackets or quotes.
  // Link headers format: <url>; rel="alternate"; type="application/rss+xml"
  const links = linkHeader.split(/,(?=\s*<)/)

  for (const link of links) {
    // Parse URL from angle brackets: <URL>
    // URLs in Link headers should not contain < or > (must be percent-encoded)
    const urlMatch = link.match(/<([^<>]+)>/)
    const relMatch = link.match(/rel=["']?([^"';,]+)["']?/i)
    const typeMatch = link.match(/type=["']?([^"';,]+)["']?/i)

    if (!urlMatch) {
      continue
    }

    const url = urlMatch[1]
    const rel = relMatch?.[1]?.toLowerCase()
    const type = typeMatch?.[1]

    // Check if this is an alternate feed link with matching MIME type
    if (rel === 'alternate' && type && isAnyOf(type, options.linkMimeTypes, normalizeMimeType)) {
      feedUris.add(url)
    }
  }

  return Array.from(feedUris)
}
