export type DiscoverFeedsOptions = {
  feedContentTypes: Array<string>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

export type ParserContext = {
  discoveredUrls: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: DiscoverFeedsOptions
}
