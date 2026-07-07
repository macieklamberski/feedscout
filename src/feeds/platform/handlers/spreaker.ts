import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Spreaker shows live at `spreaker.com/podcast/{slug}--{id}` (with a
// numeric `/show/{id}` form that 301-redirects to the slug-suffixed
// canonical) and the show HTML advertises the canonical RSS feed at
// `spreaker.com/show/{id}/episodes/feed` via
// `<link rel="alternate" type="application/rss+xml">`. The handler pulls
// the numeric show ID from either URL shape and constructs the feed URL
// directly, skipping the redirect hop.

const hosts = ['spreaker.com', 'www.spreaker.com']
const podcastRegex = /^\/podcast\/[\w-]+--(\d+)/
// /show/{id} bare numeric form 301-redirects to the slug-suffixed canonical.
const showRegex = /^\/show\/(\d+)(?:\/|$)/

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const id = pathname.match(podcastRegex)?.[1] ?? pathname.match(showRegex)?.[1]

    if (!id) {
      return []
    }

    return [
      {
        uri: `https://www.spreaker.com/show/${id}/episodes/feed`,
        hint: composeHint('spreaker:podcast'),
      },
    ]
  },
}
