import { defaultFetchFn } from '../../common/discover/utils.js'
import type { DiscoverInput } from '../../common/types.js'
import { normalizeUrl } from '../../common/utils.js'
import { discoverHubsFromFeed } from '../feed/index.js'
import { discoverHubsFromHeaders } from '../headers/index.js'
import { discoverHubsFromHtml } from '../html/index.js'
import type { DiscoverHubsOptions, HubResult } from './types.js'
import { normalizeInput } from './utils.js'

export const discoverHubs = async (
  input: DiscoverInput,
  options: DiscoverHubsOptions = {},
): Promise<Array<HubResult>> => {
  const {
    methods = ['headers', 'feed', 'html'],
    fetchFn = defaultFetchFn,
    normalizeUrlFn = normalizeUrl,
  } = options

  const normalizedInput = await normalizeInput(input, fetchFn)
  const results: Array<HubResult> = []

  if (methods.includes('headers') && normalizedInput.headers) {
    const headerHubs = discoverHubsFromHeaders(
      normalizedInput.headers,
      normalizedInput.url,
      normalizeUrlFn,
    )
    results.push(...headerHubs)
  }

  if (methods.includes('feed') && normalizedInput.content) {
    const feedHubs = discoverHubsFromFeed(normalizedInput.content, normalizedInput.url)
    results.push(...feedHubs)
  }

  if (methods.includes('html') && normalizedInput.content) {
    const htmlHubs = discoverHubsFromHtml(
      normalizedInput.content,
      normalizedInput.url,
      normalizeUrlFn,
    )
    results.push(...htmlHubs)
  }

  return results
}
