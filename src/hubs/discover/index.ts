import { defaultFetchFn, defaultResolveUrlFn } from '../../common/discover/defaults.js'
import { attempt, normalizeInput } from '../../common/discover/utils.js'
import type { DiscoverInput, DiscoverResolveUrlFn } from '../../common/types.js'
import { discoverHubsFromFeed } from '../feed/index.js'
import { discoverHubsFromHeaders } from '../headers/index.js'
import { discoverHubsFromHtml } from '../html/index.js'
import type { DiscoverHubsOptions, HubResult } from './types.js'

export const discoverHubs = async (
  input: DiscoverInput,
  options: DiscoverHubsOptions = {},
): Promise<Array<HubResult>> => {
  const {
    methods = ['headers', 'feed', 'html'],
    fetchFn = defaultFetchFn,
    resolveUrlFn = defaultResolveUrlFn,
    onError,
  } = options

  // The resolveUrlFn is wrapped where it enters: a throw is reported and the URL is kept as
  // discovered, so the methods call it without a guard of their own.
  const safeResolveUrlFn: DiscoverResolveUrlFn = (url, baseUrl) => {
    return attempt(() => resolveUrlFn(url, baseUrl), url, 'resolveUrlFn', onError)
  }
  const normalizedInput = await normalizeInput(input, fetchFn, onError)
  const results: Array<HubResult> = []

  if (methods.includes('headers') && normalizedInput.headers) {
    const headerHubs = discoverHubsFromHeaders(
      normalizedInput.headers,
      normalizedInput.url,
      safeResolveUrlFn,
    )
    results.push(...headerHubs)
  }

  if (methods.includes('feed') && normalizedInput.content) {
    const feedHubs = discoverHubsFromFeed(
      normalizedInput.content,
      normalizedInput.url,
      safeResolveUrlFn,
    )
    results.push(...feedHubs)
  }

  if (methods.includes('html') && normalizedInput.content) {
    const htmlHubs = discoverHubsFromHtml(
      normalizedInput.content,
      normalizedInput.url,
      safeResolveUrlFn,
    )
    results.push(...htmlHubs)
  }

  // An Atom feed carries its hub in a link element that the Feed and HTML methods both read.
  const seen = new Set<string>()

  return results.filter((result) => {
    const key = `${result.hub}\0${result.topic}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}
