import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers featured, news (html), partly covers profile.
// Handler needed for: animelist, history, mangalist.

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

const feeds = definePlatformFeeds([
  { key: 'myanimelist:news', template: 'https://myanimelist.net/rss/news.xml' },
  { key: 'myanimelist:featured', template: 'https://myanimelist.net/rss/featured.xml' },
  { key: 'myanimelist:anime', template: 'https://myanimelist.net/rss.php?type=rw&u={username}' },
  { key: 'myanimelist:manga', template: 'https://myanimelist.net/rss.php?type=rm&u={username}' },
  {
    key: 'myanimelist:recently-watched',
    template: 'https://myanimelist.net/rss.php?type=rwe&u={username}',
  },
  {
    key: 'myanimelist:recently-read',
    template: 'https://myanimelist.net/rss.php?type=rrm&u={username}',
  },
  { key: 'myanimelist:blog', template: 'https://myanimelist.net/rss.php?type=blog&u={username}' },
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

    if (parsed.kind === 'news') {
      return [feeds.getFeedEntry('myanimelist:news')]
    }

    if (parsed.kind === 'featured') {
      return [feeds.getFeedEntry('myanimelist:featured')]
    }

    const username = decodeSegment(parsed.username) ?? parsed.username

    return [
      feeds.getFeedEntry('myanimelist:anime', { username }),
      feeds.getFeedEntry('myanimelist:manga', { username }),
      feeds.getFeedEntry('myanimelist:recently-watched', { username }),
      feeds.getFeedEntry('myanimelist:recently-read', { username }),
      feeds.getFeedEntry('myanimelist:blog', { username }),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
