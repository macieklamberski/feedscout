export type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content: string) => Array<string>
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
}
