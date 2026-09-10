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
  // Element attributes scanned for feed labels (matched against anchorLabels), on the anchor itself
  // and on any descendant while the anchor is open. Covers icon-only links whose only signal is an
  // attribute rather than visible text — title, aria-label, or a layer name such as the one Framer
  // emits for the feed icon (<div data-framer-name="RSS Icon">).
  anchorAttributes?: Array<string>
}

export type HtmlMethodContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  baseHref?: string
  options: HtmlMethodOptions
}
