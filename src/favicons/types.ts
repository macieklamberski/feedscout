import type {
  DiscoverEnrichFn,
  DiscoverOptions,
  DiscoverRef,
  FetchFn,
  MaybePromise,
} from '../common/types.js'

// TODO: Extend with metadata (rel, sizes, type) from HTML attributes.
// biome-ignore lint/complexity/noBannedTypes: No extra metadata yet.
export type FaviconResult = {}

export type FaviconEnricherContext = {
  fetchFn: FetchFn
}

// Returns undefined for a ref of another platform, so enrichers can be tried in turn.
export type FaviconEnricher = (
  ref: DiscoverRef,
  context: FaviconEnricherContext,
) => MaybePromise<Array<string> | undefined>

export type CreateEnrichFaviconFnOptions = {
  enrichers?: Array<FaviconEnricher>
  fetchFn: FetchFn
}

export type DiscoverFaviconsOptions<TValid> = DiscoverOptions<TValid> & {
  enrichFn?: DiscoverEnrichFn
}
