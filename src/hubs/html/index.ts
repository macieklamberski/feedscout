import { discoverUrisFromHtml } from '../../common/uris/html/index.js'
import { normalizeUrl } from '../../common/utils.js'
import type { HubResult } from '../discover/types.js'

const hubSelector = [{ rel: 'hub' }]
const selfSelector = [{ rel: 'self' }]

const htmlOptions = {
  anchorUris: [],
  anchorIgnoredUris: [],
  anchorLabels: [],
}

export const discoverHubsFromHtml = (content: string, baseUrl: string): Array<HubResult> => {
  const hubUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: hubSelector })

  if (hubUris.length === 0) {
    return []
  }

  const selfUris = discoverUrisFromHtml(content, { ...htmlOptions, linkSelectors: selfSelector })
  const topic = selfUris[0] ? normalizeUrl(selfUris[0], baseUrl) : baseUrl

  return hubUris.map((hub) => ({
    hub: normalizeUrl(hub, baseUrl),
    topic,
  }))
}
