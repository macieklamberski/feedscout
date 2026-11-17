import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: anime, blog, featured, manga, news, recently-read, recently-watched.

export type MyanimelistUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'user'; username: string }
  | { kind: 'news' }
  | { kind: 'featured' }

export const hosts = ['myanimelist.net', 'www.myanimelist.net']

const profileRegex = /^\/profile\/([^/]+)\/?$/i
const userRegex = /^\/(?:profile|animelist|mangalist|history)\/([^/]+)/i
const newsRegex = /^\/news(?:\/|$)/i
const featuredRegex = /^\/featured(?:\/|$)/i

const feeds = definePlatformFeeds('myanimelist', [
  { key: 'news', main: 'https://myanimelist.net/rss/news.xml' },
  { key: 'featured', main: 'https://myanimelist.net/rss/featured.xml' },
  { key: 'anime', main: 'https://myanimelist.net/rss.php?type=rw&u={username}' },
  { key: 'manga', main: 'https://myanimelist.net/rss.php?type=rm&u={username}' },
  {
    key: 'recently-watched',
    main: 'https://myanimelist.net/rss.php?type=rwe&u={username}',
  },
  {
    key: 'recently-read',
    main: 'https://myanimelist.net/rss.php?type=rrm&u={username}',
  },
  { key: 'blog', main: 'https://myanimelist.net/rss.php?type=blog&u={username}' },
])

export const parseMyanimelistUrl = (url: string): MyanimelistUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl

  if (newsRegex.test(pathname)) {
    return { kind: 'news' }
  }

  if (featuredRegex.test(pathname)) {
    return { kind: 'featured' }
  }

  // The profile page itself, while its tabs, lists and history are the user's other pages.
  const profileUsername = pathname.match(profileRegex)?.[1]

  if (profileUsername) {
    return { kind: 'profile', username: profileUsername }
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
    return { kind: 'news' }
  }

  return { kind: 'user', username }
}

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return parseMyanimelistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMyanimelistUrl(url)

    if (!parsed) {
      return []
    }

    // The news and featured articles feeds need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'news') {
      return [feeds.getFeedEntry('news'), feeds.getFeedEntry('featured')]
    }

    if (parsed.kind === 'featured') {
      return [feeds.getFeedEntry('featured'), feeds.getFeedEntry('news')]
    }

    const username = decodeSegment(parsed.username) ?? parsed.username

    return [
      feeds.getFeedEntry('anime', { username }),
      feeds.getFeedEntry('manga', { username }),
      feeds.getFeedEntry('recently-watched', { username }),
      feeds.getFeedEntry('recently-read', { username }),
      feeds.getFeedEntry('blog', { username }),
      feeds.getFeedEntry('news'),
      feeds.getFeedEntry('featured'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
