import type { LinkSelector } from '../../types.js'

export type HtmlMethodOptions = {
  baseUrl?: string
  linkSelectors: Array<LinkSelector>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
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
