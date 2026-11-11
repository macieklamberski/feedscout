import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers page (html).
// Handler needed for: user.

export type TogetterUrl = { kind: 'user'; username: string } | { kind: 'home' }

export const hosts = ['togetter.com', 'www.togetter.com']

const userPathRegex = /^\/id\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'togetter:news', template: 'https://togetter.com/rss/news' },
  { key: 'togetter:hot', template: 'https://togetter.com/rss/hot' },
  { key: 'togetter:curator', template: 'https://togetter.com/rss/id/{username}' },
])

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userPathRegex)?.[1]

  if (!username) {
    return { kind: 'home' }
  }

  return { kind: 'user', username }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return parseTogetterUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTogetterUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('togetter:curator', { username: parsed.username }),
        feeds.getFeedEntry('togetter:hot'),
      ]
    }

    return [feeds.getFeedEntry('togetter:news'), feeds.getFeedEntry('togetter:hot')]
  },

  getFeedKey: feeds.getFeedKey,
}
