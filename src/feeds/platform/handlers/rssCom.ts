import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['rss.com', 'www.rss.com']
const podcastRegex = /^\/podcasts\/([^/]+)/

export const rssComHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(podcastRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `https://media.rss.com/${match[1]}/feed.xml`,
        hint: composeHint('rss-com:podcast'),
      },
    ]
  },
}
