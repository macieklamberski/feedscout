import type {
  DiscoverFetchFn,
  DiscoverOnErrorFn,
  DiscoverResolveUrlFn,
} from '../../common/types.js'

export type HubResult = {
  hub: string
  topic: string
}

export type DiscoverHubsMethodsConfig = Array<'headers' | 'html' | 'feed'>

export type DiscoverHubsOptions = {
  methods?: DiscoverHubsMethodsConfig
  fetchFn?: DiscoverFetchFn
  resolveUrlFn?: DiscoverResolveUrlFn
  onError?: DiscoverOnErrorFn
}
