export type HtmlMethodOptions = {
  baseUrl?: string
  linkRels: Array<string>
  linkMimeTypes: Array<string>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

export type HtmlMethodContext = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: HtmlMethodOptions
}
