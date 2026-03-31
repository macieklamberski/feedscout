import type { DiscoverResolveUrlFn } from '../../common/types.js'
import { discoverUrisFromHeaders } from '../../common/uris/headers/index.js'
import { resolveUrl } from '../../common/utils.js'
import type { HubResult } from '../discover/types.js'

const hubSelector = [{ rel: 'hub' }]
const selfSelector = [{ rel: 'self' }]

export const discoverHubsFromHeaders = (
  headers: Headers,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn = resolveUrl,
): Array<HubResult> => {
  const hubUris = discoverUrisFromHeaders(headers, { linkSelectors: hubSelector })

  if (hubUris.length === 0) {
    return []
  }

  const selfUris = discoverUrisFromHeaders(headers, { linkSelectors: selfSelector })
  const topic = selfUris[0] ? resolveUrlFn(selfUris[0], baseUrl) : baseUrl

  return hubUris.map((hub) => ({
    hub: resolveUrlFn(hub, baseUrl),
    topic,
  }))
}
