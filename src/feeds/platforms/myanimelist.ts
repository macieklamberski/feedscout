import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers featured, news (html), partly covers profile.
// Handler needed for: animelist, history, mangalist.

export type MyanimelistUrl =
  | { kind: 'user'; username: string }
  | { kind: 'news' }
  | { kind: 'featured' }

export const hosts = ['myanimelist.net', 'www.myanimelist.net']
const userRegex = /^\/(?:profile|animelist|mangalist|history)\/([^/]+)/i
const newsRegex = /^\/news(?:\/|$)/i
const featuredRegex = /^\/featured(?:\/|$)/i

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

  const username = pathname.match(userRegex)?.[1]

  if (!username) {
    return
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
      return [
        {
          uri: 'https://myanimelist.net/rss/news.xml',
          hint: composeHint('myanimelist:news'),
        },
      ]
    }

    if (parsed.kind === 'featured') {
      return [
        {
          uri: 'https://myanimelist.net/rss/featured.xml',
          hint: composeHint('myanimelist:featured'),
        },
      ]
    }

    const { username } = parsed
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rw&u=${username}`,
      hint: composeHint('myanimelist:anime'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rm&u=${username}`,
      hint: composeHint('myanimelist:manga'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rwe&u=${username}`,
      hint: composeHint('myanimelist:recently-watched'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rrm&u=${username}`,
      hint: composeHint('myanimelist:recently-read'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=blog&u=${username}`,
      hint: composeHint('myanimelist:blog'),
    })

    return uris
  },
}
