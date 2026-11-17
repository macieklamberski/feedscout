import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PromodjUrl = { kind: 'profile'; username: string }

const hosts = ['promodj.com', 'www.promodj.com']

const feeds = definePlatformFeeds('promodj', [
  {
    key: 'podcast',
    main: 'https://promodj.com/{username}/podcast.xml',
    aliases: ['https://promodj.com/{username}/podcast_alt.xml'],
  },
  { key: 'content', main: 'https://promodj.com/{username}/rss.xml' },
  { key: 'blog', main: 'https://promodj.com/{username}/blog.xml' },
  { key: 'favorites', main: 'https://promodj.com/{username}/bookmarks.xml' },
  { key: 'events', main: 'https://promodj.com/{username}/avisha.xml' },
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
      feeds.getFeedEntry('podcast', params),
      feeds.getFeedEntry('content', params),
      feeds.getFeedEntry('blog', params),
      feeds.getFeedEntry('favorites', params),
      feeds.getFeedEntry('events', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
