import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Not discoverable without handler.

const hosts = ['myanimelist.net', 'www.myanimelist.net']
const userRegex = /^\/(?:profile|animelist|mangalist|history)\/([^/]+)/

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Site-wide news feed: /news
    if (pathname === '/news' || pathname.startsWith('/news/')) {
      return [
        {
          uri: 'https://myanimelist.net/rss/news.xml',
          hint: composeHint('myanimelist:news'),
        },
      ]
    }

    // Featured articles feed: /featured
    if (pathname === '/featured' || pathname.startsWith('/featured/')) {
      return [
        {
          uri: 'https://myanimelist.net/rss/featured.xml',
          hint: composeHint('myanimelist:featured'),
        },
      ]
    }

    const match = pathname.match(userRegex)

    if (!match?.[1]) {
      return []
    }

    const user = match[1]
    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rw&u=${user}`,
      hint: composeHint('myanimelist:anime'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rm&u=${user}`,
      hint: composeHint('myanimelist:manga'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rrw&u=${user}`,
      hint: composeHint('myanimelist:recently-watched'),
    })
    uris.push({
      uri: `https://myanimelist.net/rss.php?type=rrm&u=${user}`,
      hint: composeHint('myanimelist:recently-read'),
    })

    return uris
  },
}
