import { isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// MyAnimeList exposes per-user list feeds at
// `myanimelist.net/rss.php?type={rw,rm,rrw,rrm}&u={user}` and site-wide feeds at
// `myanimelist.net/rss/news.xml` and `myanimelist.net/rss/featured.xml`. None of
// these are surfaced via HTML `<link rel="alternate">` on the corresponding human
// pages (`/profile/`, `/animelist/`, `/news`, `/featured`). The handler maps the
// profile/list/history/news/featured URL shapes onto the canonical `rss.php` query
// or `/rss/*.xml` URLs and emits all four user list variants in one go.

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
