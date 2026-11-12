import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FiresideUrl = { kind: 'podcast'; slug: string }

const domains = ['fireside.fm']
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feeds.fireside.fm']

const feeds = definePlatformFeeds([
  { key: 'fireside:podcast', template: 'https://feeds.fireside.fm/{slug}/rss', format: 'rss' },
  { key: 'fireside:podcast', template: 'https://{slug}.fireside.fm/json', format: 'json' },
])

export const parseFiresideUrl = (url: string): FiresideUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug || isHostOf(url, feedHosts)) {
    return
  }

  return { kind: 'podcast', slug }
}

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return parseFiresideUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFiresideUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('fireside:podcast', { slug: parsed.slug }, 'rss'),
      feeds.getFeedEntry('fireside:podcast', { slug: parsed.slug }, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
