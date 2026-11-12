import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PromodjUrl = { kind: 'profile'; username: string }

const hosts = ['promodj.com', 'www.promodj.com']

const feeds = definePlatformFeeds([
  { key: 'promodj:podcast', template: 'https://promodj.com/{username}/podcast.xml' },
  { key: 'promodj:content', template: 'https://promodj.com/{username}/rss.xml' },
  { key: 'promodj:blog', template: 'https://promodj.com/{username}/blog.xml' },
  { key: 'promodj:favorites', template: 'https://promodj.com/{username}/bookmarks.xml' },
  { key: 'promodj:events', template: 'https://promodj.com/{username}/avisha.xml' },
])

export const parsePromodjUrl = (url: string): PromodjUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const promodjHandler: PlatformHandler = {
  match: (url) => {
    return parsePromodjUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePromodjUrl(url)

    if (!parsed) {
      return []
    }

    const params = { username: parsed.username }

    return [
      feeds.getFeedEntry('promodj:podcast', params),
      feeds.getFeedEntry('promodj:content', params),
      feeds.getFeedEntry('promodj:blog', params),
      feeds.getFeedEntry('promodj:favorites', params),
      feeds.getFeedEntry('promodj:events', params),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
