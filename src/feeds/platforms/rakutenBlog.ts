import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type RakutenBlogUrl = { kind: 'blog'; username: string }

const hosts = ['plaza.rakuten.co.jp']

// A blog page links its feed under `/rss/`, and the feed host serves the same feed at the blog's
// root too, so the table reads both paths.
const feeds = definePlatformFeeds([
  { key: 'rakuten-blog:posts', template: 'https://api.plaza.rakuten.ne.jp/{username}/rss/' },
  { key: 'rakuten-blog:posts', template: 'https://api.plaza.rakuten.ne.jp/{username}/' },
])

export const parseRakutenBlogUrl = (url: string): RakutenBlogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  // Rakuten blog names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'blog', username }
}

export const rakutenBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseRakutenBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseRakutenBlogUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('rakuten-blog:posts', { username: parsed.username })]
  },

  getFeedKey: feeds.getFeedKey,
}
