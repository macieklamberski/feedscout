import type { DiscoverUriEntry } from '../../types.js'

export type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, content?: string) => Array<DiscoverUriEntry>
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
}
