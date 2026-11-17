import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: plurks, responses.

export type PlurkUrl = { kind: 'post'; postId: string } | { kind: 'user'; username: string }

const hosts = ['plurk.com', 'www.plurk.com']

const feeds = definePlatformFeeds([
  { key: 'plurk:responses', main: 'https://www.plurk.com/p/{postId}.xml' },
  // A user page links this spelling, and the feed names the `/user/` one as its self link.
  {
    key: 'plurk:plurks',
    main: 'https://www.plurk.com/{username}.xml',
    aliases: ['https://www.plurk.com/user/{username}.xml'],
  },
])

export const parsePlurkUrl = (url: string): PlurkUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const segments = getPathSegments(url)
  const [mobileOrRoute] = segments
  const isMobile = isAnyOf(mobileOrRoute, 'm')
  const [route, value] = isMobile ? segments.slice(1) : segments

  if (isAnyOf(route, 'p')) {
    if (!value) {
      return
    }

    return { kind: 'post', postId: value }
  }

  const username = isAnyOf(route, 'u') ? value : route

  // Plurk names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'user', username }
}

export const plurkHandler: PlatformHandler = {
  match: (url) => {
    return parsePlurkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePlurkUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'post') {
      return [feeds.getFeedEntry('plurk:responses', { postId: parsed.postId })]
    }

    return [feeds.getFeedEntry('plurk:plurks', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
