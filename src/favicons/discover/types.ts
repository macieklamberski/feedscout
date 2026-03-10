import type { DiscoverFetchFn, DiscoverNormalizeUrlFn } from '../../common/types.js'
import type { ApiMethodOptions } from '../api/index.js'
import type { GuessMethodOptions } from '../guess/index.js'

export type FaviconMethod = 'html' | 'manifest' | 'headers' | 'guess' | 'api'

export type FaviconResult = {
  url: string
  type?: string
  sizes?: string
  rel?: string
  method: FaviconMethod
}

export type DiscoverFaviconsMethodsConfig = Array<FaviconMethod>

export type DiscoverFaviconsOptions = {
  methods?: DiscoverFaviconsMethodsConfig
  fetchFn?: DiscoverFetchFn
  normalizeUrlFn?: DiscoverNormalizeUrlFn
  guess?: GuessMethodOptions
  api?: ApiMethodOptions
}
