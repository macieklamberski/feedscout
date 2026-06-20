import type { DiscoverFetchFn, DiscoverUriEntry } from '../../types.js'
import { matchesAnyOfLinkSelectors } from '../../utils.js'
import type { WellknownMethodOptions } from './types.js'

export const discoverUrisFromWellknown = async (
  options: WellknownMethodOptions,
  fetchFn: DiscoverFetchFn,
): Promise<Array<DiscoverUriEntry>> => {
  try {
    const origin = new URL(options.baseUrl).origin
    const url = `${origin}/.well-known/host-meta.json`
    const response = await fetchFn(url)
    const body = typeof response.body === 'string' ? response.body : ''
    const document = JSON.parse(body)

    if (!Array.isArray(document?.links)) {
      return []
    }

    return document.links
      .filter((link: Record<string, unknown>) => {
        return (
          typeof link.href === 'string' &&
          typeof link.rel === 'string' &&
          matchesAnyOfLinkSelectors(
            link.rel,
            typeof link.type === 'string' ? link.type : undefined,
            options.linkSelectors,
          )
        )
      })
      .map((link: Record<string, string>) => {
        return { uri: link.href }
      })
  } catch {}

  return []
}
