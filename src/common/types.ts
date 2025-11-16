export type HtmlDiscoveryOptions = {
  linkMimeTypes: Array<string>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

export type HtmlFeedUrisContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: HtmlDiscoveryOptions
}

export type HeadersDiscoveryOptions = {
  linkMimeTypes: Array<string>
}

export type DiscoverFeedUrisOptions = {
  methods?: Array<'html' | 'headers' | 'cms'>
  html?: HtmlDiscoveryOptions
  headers?: HeadersDiscoveryOptions
}
