import type { DiscoverOnErrorFn, DiscoverResolveUrlFn, FetchFn } from '../../common/types.js'

export type HubResult = {
  hub: string
  topic: string
}

export type DiscoverHubsMethodsConfig = Array<'headers' | 'html' | 'feed'>

export type DiscoverHubsOptions = {
  methods?: DiscoverHubsMethodsConfig
  fetchFn?: FetchFn
  resolveUrlFn?: DiscoverResolveUrlFn
  onError?: DiscoverOnErrorFn
}
