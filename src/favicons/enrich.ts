import type { DiscoverEnrichFn } from '../common/types.js'
import { defaultFaviconEnrichers } from './defaults.js'
import type { CreateEnrichFaviconFnOptions, FaviconEnricherContext } from './types.js'

// An enrich function that answers a ref with the first enricher that returns URIs for it.
export const createEnrichFaviconFn = (options: CreateEnrichFaviconFnOptions): DiscoverEnrichFn => {
  const { enrichers = defaultFaviconEnrichers, fetchFn } = options
  const context: FaviconEnricherContext = { fetchFn }

  return async (ref) => {
    for (const enricher of enrichers) {
      const uris = await enricher(ref, context)

      if (uris) {
        return uris
      }
    }
  }
}
