export type DiscoverFeedUrisOptions = {
  linkMimeTypes: Array<string>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

export type ParserContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: DiscoverFeedUrisOptions
}
