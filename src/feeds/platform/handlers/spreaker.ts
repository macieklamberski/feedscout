import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

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
