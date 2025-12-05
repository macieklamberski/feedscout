import { createNativeFetchAdapter } from '../common/discover/adapters.js'
import type { DiscoverInput } from '../common/types.js'
import { discoverUrisFromHeaders } from '../common/uris/headers/index.js'
import { discoverUrisFromHtml } from '../common/uris/html/index.js'
import { normalizeUrl } from '../common/utils.js'
import type { DiscoverHubsOptions, HubResult } from './types.js'
import { normalizeInput } from './utils.js'

const hubSelector = [{ rel: 'hub' }]
const selfSelector = [{ rel: 'self' }]

export const discoverHubs = async (
  input: DiscoverInput,
  options: DiscoverHubsOptions = {},
): Promise<Array<HubResult>> => {
  const { methods = ['headers', 'html'], fetchFn = createNativeFetchAdapter() } = options

  const normalizedInput = await normalizeInput(input, fetchFn)
  const results: Array<HubResult> = []

  if (methods.includes('headers') && normalizedInput.headers) {
    const hubUris = discoverUrisFromHeaders(normalizedInput.headers, { linkSelectors: hubSelector })

    if (hubUris.length > 0) {
      const selfUris = discoverUrisFromHeaders(normalizedInput.headers, {
        linkSelectors: selfSelector,
      })
      const selfUri = selfUris[0]
        ? normalizeUrl(selfUris[0], normalizedInput.url)
        : normalizedInput.url

      for (const hub of hubUris) {
        results.push({
          hub: normalizeUrl(hub, normalizedInput.url),
          topic: selfUri,
        })
      }
    }
  }

  if (methods.includes('html') && normalizedInput.content) {
    const hubUris = discoverUrisFromHtml(normalizedInput.content, {
      linkSelectors: hubSelector,
      anchorUris: [],
      anchorIgnoredUris: [],
      anchorLabels: [],
    })

    if (hubUris.length > 0) {
      const selfUris = discoverUrisFromHtml(normalizedInput.content, {
        linkSelectors: selfSelector,
        anchorUris: [],
        anchorIgnoredUris: [],
        anchorLabels: [],
      })
      const selfUri = selfUris[0]
        ? normalizeUrl(selfUris[0], normalizedInput.url)
        : normalizedInput.url

      for (const hub of hubUris) {
        results.push({
          hub: normalizeUrl(hub, normalizedInput.url),
          topic: selfUri,
        })
      }
    }
  }

  return results
}
