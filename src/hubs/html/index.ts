import { defaultResolveUrlFn } from '../../common/discover/utils.js'
import type { DiscoverResolveUrlFn } from '../../common/types.js'
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
  resolveUrlFn: DiscoverResolveUrlFn = defaultResolveUrlFn,
): Array<HubResult> => {
  const hubUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: hubSelector })

  if (hubUris.length === 0) {
    return []
  }

  const selfUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: selfSelector })
  const topic = selfUris[0] ? (resolveUrlFn(selfUris[0], baseUrl) ?? selfUris[0]) : baseUrl

  return hubUris.map((hub) => ({
    hub: resolveUrlFn(hub, baseUrl) ?? hub,
    topic,
  }))
}
