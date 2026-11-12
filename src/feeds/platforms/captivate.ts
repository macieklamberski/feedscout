import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CaptivateUrl = { kind: 'show'; slug: string }

const domains = ['captivate.fm']
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feeds.captivate.fm']

// The feed URL without the trailing slash answers 301.
const feeds = definePlatformFeeds([
  { key: 'captivate:podcast', template: 'https://feeds.captivate.fm/{slug}/' },
])

export const parseCaptivateUrl = (url: string): CaptivateUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug || isHostOf(url, feedHosts)) {
    return
  }

  return { kind: 'show', slug }
}

export const captivateHandler: PlatformHandler = {
  match: (url) => {
    return parseCaptivateUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCaptivateUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('captivate:podcast', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
