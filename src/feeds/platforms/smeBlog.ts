import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SmeBlogUrl = { kind: 'blog'; username: string } | { kind: 'home' }

const hosts = ['blog.sme.sk']

const feeds = definePlatformFeeds('sme-blog', [
  { key: 'site', main: 'https://blog.sme.sk/rss' },
  { key: 'posts', main: 'https://blog.sme.sk/{username}/rss' },
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

    // The site feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'blog') {
      return [
        feeds.getFeedEntry('posts', { username: parsed.username }),
        feeds.getFeedEntry('site'),
      ]
    }

    return [feeds.getFeedEntry('site')]
  },

  getFeedHint: feeds.getFeedHint,
}
