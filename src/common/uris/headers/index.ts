import { matchesAnyOfLinkSelectors } from '../../../common/utils.js'
import type { HeadersMethodOptions } from './types.js'

export const discoverUrisFromHeaders = (
  headers: Headers,
  options: HeadersMethodOptions,
): Array<string> => {
  const uris = new Set<string>()
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

    if (!rel) {
      continue
    }

    if (matchesAnyOfLinkSelectors(rel, type, options.linkSelectors)) {
      uris.add(url)
    }
  }

  return Array.from(uris)
}
