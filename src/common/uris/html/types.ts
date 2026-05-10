import type { LinkSelector, Pattern } from '../../types.js'

export type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<Pattern>
  anchorIgnoredUris: Array<Pattern>
  anchorLabels: Array<Pattern>
  jsonLdTypes?: Array<string>
}

export type HtmlMethodContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  currentScript: { isJsonLd: boolean; content: string } | null
  options: HtmlMethodOptions
}
