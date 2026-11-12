import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type SmeBlogUrl = { kind: 'blog'; username: string } | { kind: 'home' }

const hosts = ['blog.sme.sk']

const feeds = definePlatformFeeds([
  { key: 'sme-blog:site', template: 'https://blog.sme.sk/rss' },
  { key: 'sme-blog:posts', template: 'https://blog.sme.sk/{username}/rss' },
])

export const parseSmeBlogUrl = (url: string): SmeBlogUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'blog', username }
}

export const smeBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSmeBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSmeBlogUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'blog') {
      return [feeds.getFeedEntry('sme-blog:posts', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('sme-blog:site')]
  },

  getFeedKey: feeds.getFeedKey,
}
