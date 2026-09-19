import { resolveUrl } from '../../common/discover/utils.js'
import type { DiscoverOnErrorFn, DiscoverResolveUrlFn } from '../../common/types.js'
import { discoverUrisFromHtml } from '../../common/uris/html/index.js'
import type { HubResult } from '../discover/types.js'

const hubSelector = [{ rel: 'hub' }]
const selfSelector = [{ rel: 'self' }]

const htmlOptions = {
  anchorUris: [],
  anchorIgnoredUris: [],
  anchorLabels: [],
}

export const discoverHubsFromHtml = (
  content: string,
  baseUrl: string,
  resolveUrlFn: DiscoverResolveUrlFn,
  onError?: DiscoverOnErrorFn,
): Array<HubResult> => {
  const hubUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: hubSelector })

  if (hubUris.length === 0) {
    return []
  }

  const selfUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: selfSelector })
  const topic = selfUris[0] ? resolveUrl(resolveUrlFn, selfUris[0], baseUrl, onError) : baseUrl

  return hubUris.map((hub) => ({
    hub: resolveUrl(resolveUrlFn, hub, baseUrl, onError),
    topic,
  }))
}
