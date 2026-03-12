import type { DiscoverFetchFn, DiscoverUriEntry } from '../../types.js'

export type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    fetchFn?: DiscoverFetchFn,
  ) => Array<DiscoverUriEntry> | Promise<Array<DiscoverUriEntry>>
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
}
