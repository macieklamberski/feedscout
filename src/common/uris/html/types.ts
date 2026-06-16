import type { LinkSelector, Pattern } from '../../types.js'

export type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<Pattern>
  // Matched against the href's pathname only (not the query), so a feed path embedded in a
  // wrapper's query string (e.g. ?add=https://site/rss/x) does not count as a feed.
  anchorPathSegments?: Array<Pattern>
  anchorIgnoredUris: Array<Pattern>
  anchorLabels: Array<Pattern>
}

export type HtmlMethodContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: HtmlMethodOptions
}
