import { attempt } from '../../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import { discoverUrisFromHeaders } from '../../common/uris/headers/index.js'
import type { HubResult } from '../discover/types.js'

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
  const topic = selfUris[0]
    ? attempt(() => resolveUrlFn(selfUris[0], baseUrl), selfUris[0], 'resolveUrlFn', onError)
    : baseUrl

  return hubUris.map((hub) => ({
    hub: attempt(() => resolveUrlFn(hub, baseUrl), hub, 'resolveUrlFn', onError),
    topic,
  }))
}
