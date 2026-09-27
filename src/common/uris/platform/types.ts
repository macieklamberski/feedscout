import type {
  DiscoverEnrichFn,
  DiscoverRef,
  DiscoverUriEntry,
  FetchFn,
  MaybePromise,
} from '../../types.js'

export type PlatformHandler = {
  match: (url: string, content?: string, headers?: Headers) => boolean
  // TODO: Fold DiscoverRef into DiscoverUriEntry as an optional `ref`, as feedsweep's placeholder
  // carries its result and its ref in one item, so an entry can hold a page URL with the enriched
  // URLs as its fallbacks. It makes `uri` optional in an exported type.
  resolve: (
    url: string,
    content?: string,
    headers?: Headers,
    fetchFn?: FetchFn,
  ) => MaybePromise<Array<DiscoverUriEntry | DiscoverRef>>
  // Full URL of any tenant's feed on the handler's host. Guessed URLs matching it are dropped
  // when the handler matches, as `/feed.xml` there can be the feed of a user named "feed".
  guessExclusionRegex?: RegExp
}

export type PlatformMethodOptions = {
  baseUrl: string
  handlers: Array<PlatformHandler>
  enrichFn?: DiscoverEnrichFn
}
