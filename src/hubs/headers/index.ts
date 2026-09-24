import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import { discoverUrisFromHeaders } from '../../common/uris/headers/index.js'
import type { HubResult } from '../discover/types.js'
import { toHubResults } from '../utils.js'

const hubSelector = [{ rel: 'hub' }]
const selfSelector = [{ rel: 'self' }]

export const discoverHubsFromHeaders = (
  headers: Headers,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  const hubUris = discoverUrisFromHeaders(headers, { linkSelectors: hubSelector })

  if (hubUris.length === 0) {
    return []
  }

  const selfUris = discoverUrisFromHeaders(headers, { linkSelectors: selfSelector })

  return toHubResults(hubUris, selfUris[0], baseUrl, resolveUrlFn, onError)
}
