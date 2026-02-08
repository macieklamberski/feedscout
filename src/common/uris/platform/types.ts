import type { UriEntry } from '../../types.js'

export type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content?: string) => Array<UriEntry>
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
}
