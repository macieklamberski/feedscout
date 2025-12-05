import { createNativeFetchAdapter } from '../../common/discover/adapters.js'
import type { DiscoverInput } from '../../common/types.js'
import { discoverHubsFromFeed } from '../feed/index.js'
import { discoverHubsFromHeaders } from '../headers/index.js'
import { discoverHubsFromHtml } from '../html/index.js'
import type { DiscoverHubsOptions, HubResult } from './types.js'
import { normalizeInput } from './utils.js'

export const discoverHubs = async (
  input: DiscoverInput,
  options: DiscoverHubsOptions = {},
): Promise<Array<HubResult>> => {
  const { methods = ['headers', 'feed', 'html'], fetchFn = createNativeFetchAdapter() } = options

  const normalizedInput = await normalizeInput(input, fetchFn)
  const results: Array<HubResult> = []

  if (methods.includes('headers') && normalizedInput.headers) {
    const headerHubs = discoverHubsFromHeaders(normalizedInput.headers, normalizedInput.url)
    results.push(...headerHubs)
  }

  if (methods.includes('feed') && normalizedInput.content) {
    const feedHubs = discoverHubsFromFeed(normalizedInput.content, normalizedInput.url)
    results.push(...feedHubs)
  }

  if (methods.includes('html') && normalizedInput.content) {
    const htmlHubs = discoverHubsFromHtml(normalizedInput.content, normalizedInput.url)
    results.push(...htmlHubs)
  }

  return results
}
