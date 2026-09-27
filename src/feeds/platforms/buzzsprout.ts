import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['buzzsprout.com', 'www.buzzsprout.com']
const numericRegex = /^\d+$/

export const buzzsproutHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const pathSegments = getPathSegments(url)

    if (pathSegments.length === 0) {
      return []
    }

    const podcastId = pathSegments[0]

    if (!numericRegex.test(podcastId)) {
      return []
    }

    return [
      {
        uri: `https://rss.buzzsprout.com/${podcastId}.rss`,
        hint: composeHint('buzzsprout:podcast'),
      },
    ]
  },
}
