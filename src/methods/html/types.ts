export type Options = {
  baseUrl?: string
  linkMimeTypes: Array<string>
  anchorUris: Array<string>
  anchorIgnoredUris: Array<string>
  anchorLabels: Array<string>
}

export type Context = {
  discoveredUris: Set<string>
  currentAnchor: {
    href: string
    text: string
  }
  options: Options
  baseUrl?: string
}
