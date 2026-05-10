import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['shows.acast.com']
const excludedPaths = ['discover']

export const acastHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const slug = pathSegments[0]

    if (isAnyOf(slug, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://feeds.acast.com/public/shows/${slug}`,
        hint: composeHint('acast:podcast'),
      },
    ]
  },
}
