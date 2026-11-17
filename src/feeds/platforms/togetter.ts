import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: curator, hot, news, recent.

export type TogetterUrl = { kind: 'user'; username: string } | { kind: 'recent' } | { kind: 'home' }

export const hosts = ['togetter.com', 'www.togetter.com']

const userPathRegex = /^\/id\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'togetter:news', main: 'https://togetter.com/rss/news' },
  { key: 'togetter:hot', main: 'https://togetter.com/rss/hot' },
  { key: 'togetter:recent', main: 'https://togetter.com/rss/recent' },
  // A curator's feed moved to posfie.com, and the togetter.com one redirects there with a 301.
  {
    key: 'togetter:curator',
    main: 'https://posfie.com/@{username}/rss',
    aliases: ['https://togetter.com/rss/id/{username}'],
  },
])

export const parseTogetterUrl = (url: string): TogetterUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userPathRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  const [route] = getPathSegments(parsedUrl)

  if (isAnyOf(route, 'recent')) {
    return { kind: 'recent' }
  }

  return { kind: 'home' }
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

    // The news, recent and popular feeds need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('togetter:curator', { username: parsed.username }),
        feeds.getFeedEntry('togetter:news'),
        feeds.getFeedEntry('togetter:recent'),
        feeds.getFeedEntry('togetter:hot'),
      ]
    }

    if (parsed.kind === 'recent') {
      return [
        feeds.getFeedEntry('togetter:recent'),
        feeds.getFeedEntry('togetter:news'),
        feeds.getFeedEntry('togetter:hot'),
      ]
    }

    return [
      feeds.getFeedEntry('togetter:news'),
      feeds.getFeedEntry('togetter:recent'),
      feeds.getFeedEntry('togetter:hot'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
