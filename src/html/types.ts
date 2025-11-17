export type Options = {
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
}
