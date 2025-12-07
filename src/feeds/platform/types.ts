import type { DiscoverFetchFn } from '../../common/types.js'

export type PlatformHandler = {
  match: (url: string) => boolean
  resolve: (url: string, fetchFn: DiscoverFetchFn) => Promise<Array<string>>
}

export type PlatformMethodOptions = {
  handlers: Array<PlatformHandler>
}
