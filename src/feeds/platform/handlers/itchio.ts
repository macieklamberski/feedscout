import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

export const itchioHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'itch.io')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Game devlog: {user}.itch.io/{game}/devlog
    if (pathSegments.length >= 2 && pathSegments[1] === 'devlog') {
      const game = pathSegments[0]

      return [`${origin}/${game}/devlog.rss`]
    }

    // Creator page or game page: {user}.itch.io or {user}.itch.io/{game}
    return [`${origin}/feed.xml`]
  },
}
