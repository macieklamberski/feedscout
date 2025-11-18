import { isAnyOf, normalizeMimeType, normalizeUrl } from '../../common/utils.js'
import type { Options } from './types.js'

export const discoverFeedUrisFromHeaders = (headers: Headers, options: Options): Array<string> => {
  const feedUris = new Set<string>()
  const linkHeader = headers.get('link')

  if (!linkHeader) {
    return []
  }

  // Split by comma, but not commas inside angle brackets or quotes.
  // Link headers format: <url>; rel="alternate"; type="application/rss+xml".
  const links = linkHeader.split(/,(?=\s*<)/)

  for (const link of links) {
    // Parse URL from angle brackets: <URL>.
    // URLs in Link headers should not contain < or > (must be percent-encoded).
    const urlMatch = link.match(/<([^<>]+)>/)
    const relMatch = link.match(/rel\s*=\s*["']?([^"';,]+)["']?/i)
    const typeMatch = link.match(/type\s*=\s*["']?([^"';,]+)["']?/i)

    if (!urlMatch) {
      continue
    }

    const url = urlMatch[1]
    const rel = relMatch?.[1]?.toLowerCase()
    const type = typeMatch?.[1]

    // Check if this is an alternate feed link with matching MIME type.
    if (rel === 'alternate' && type && isAnyOf(type, options.linkMimeTypes, normalizeMimeType)) {
      feedUris.add(normalizeUrl(url, options.baseUrl))
    }
  }

  return Array.from(feedUris)
}
