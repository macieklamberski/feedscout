import type { LinkSelector, Pattern } from '../../types.js'

export type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<Pattern>
  anchorIgnoredUris: Array<Pattern>
  anchorLabels: Array<Pattern>
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
