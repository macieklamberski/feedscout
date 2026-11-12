import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodcloudUrl = { kind: 'show'; show: string }

const domains = ['lepodcast.fr']

const feeds = definePlatformFeeds([
  { key: 'podcloud:podcast', template: 'https://{show}.lepodcast.fr/rss' },
  { key: 'podcloud:podcast', template: 'https://{show}.lepodcast.fr/feed' },
])

export const parsePodcloudUrl = (url: string): PodcloudUrl | undefined => {
  const show = getTenantSubdomain(url, domains)

  if (!show) {
    return
  }

  return { kind: 'show', show }
}

export const podcloudHandler: PlatformHandler = {
  match: (url) => {
    return parsePodcloudUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodcloudUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcloud:podcast', { show: parsed.show })]
  },

  getFeedKey: feeds.getFeedKey,
}
