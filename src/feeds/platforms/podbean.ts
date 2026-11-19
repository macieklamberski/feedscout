import { podbean } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: podcast.
// Handler needed for: latest.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const domains = podbean.hosts.tenants
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feed.podbean.com']

const feeds = withHintLabels(podbean.feeds)

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const show = getTenantSubdomain(url, domains)

  if (!show || isHostOf(url, feedHosts)) {
    return
  }

  return { kind: 'podcast', show }
}

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return parsePodbeanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodbeanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('podcast', { show: parsed.show }),
      feeds.getFeedEntry('latest', { show: parsed.show }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
