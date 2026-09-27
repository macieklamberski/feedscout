import type {
  DiscoverEnrichFn,
  DiscoverOptions,
  DiscoverRef,
  FetchFn,
  MaybePromise,
} from '../common/types.js'

export type FeedResult = {
  format: 'rss' | 'atom' | 'json' | 'rdf'
  title?: string
  description?: string
  siteUrl?: string
}

export type FeedEnricherContext = {
  fetchFn: FetchFn
}

// Returns undefined for a ref of another platform, so enrichers can be tried in turn.
export type FeedEnricher = (
  ref: DiscoverRef,
  context: FeedEnricherContext,
) => MaybePromise<Array<string> | undefined>

export type CreateEnrichFeedFnOptions = {
  enrichers?: Array<FeedEnricher>
  fetchFn: FetchFn
}

export type DiscoverFeedsOptions<TValid> = DiscoverOptions<
  TValid,
  'platform' | 'html' | 'headers' | 'guess'
> & {
  enrichFn?: DiscoverEnrichFn
}
