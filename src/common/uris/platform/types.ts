import type { DiscoverFetchFn, DiscoverUriEntry, MaybePromise } from '../../types.js'

export type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: DiscoverFetchFn,
  ) => MaybePromise<Array<DiscoverUriEntry>>
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
}
