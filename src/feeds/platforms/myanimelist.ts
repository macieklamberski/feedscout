import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers featured, news (html), partly covers profile.
// Handler needed for: animelist, mangalist.

export type MyanimelistUrl = { kind: 'user'; username: string }

export const hosts = ['myanimelist.net', 'www.myanimelist.net']
const userRegex = /^\/(?:profile|animelist|mangalist|history)\/([^/]+)/i
const newsRegex = /^\/news(?:\/|$)/i
const featuredRegex = /^\/featured(?:\/|$)/i

export const parseMyanimelistUrl = (url: string): MyanimelistUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const username = parsedUrl.pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Site-wide news feed: /news
    if (newsRegex.test(pathname)) {
      return [
        {
          uri: 'https://myanimelist.net/rss/news.xml',
          hint: composeHint('myanimelist:news'),
        },
      ]
    }

    // Featured articles feed: /featured
    if (featuredRegex.test(pathname)) {
      return [
        {
          uri: 'https://myanimelist.net/rss/featured.xml',
          hint: composeHint('myanimelist:featured'),
        },
      ]
    }

    const username = parseMyanimelistUrl(url)?.username

    if (!username) {
      return []
    }

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
