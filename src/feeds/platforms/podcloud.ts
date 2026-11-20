import { podcloud } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodcloudUrl = { kind: 'show' }

const domains = podcloud.hosts.tenants

const feeds = withHintLabels(podcloud.feeds)

export const parsePodcloudUrl = (url: string): PodcloudUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'show' }
}

export const podcloudHandler: PlatformHandler = {
  match: (url) => {
    return parsePodcloudUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodcloudUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
