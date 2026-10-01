import type { DiscoverEnrichFn } from '../common/types.js'
import { withTextBody } from '../common/utils.js'
import { defaultFeedEnrichers } from './defaults.js'
import type { CreateEnrichFeedFnOptions, FeedEnricherContext } from './types.js'

// An enrich function that answers a ref with the first enricher that returns URIs for it.
export const createEnrichFeedFn = (options: CreateEnrichFeedFnOptions): DiscoverEnrichFn => {
  const { enrichers = defaultFeedEnrichers, fetchFn } = options
  const context: FeedEnricherContext = { fetchFn: withTextBody(fetchFn) }

  return async (ref) => {
    for (const enricher of enrichers) {
      const uris = await enricher(ref, context)

      if (uris) {
        return uris
      }
    }
  }
}
