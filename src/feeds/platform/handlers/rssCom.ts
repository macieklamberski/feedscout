import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['rss.com', 'www.rss.com']
// Optional 2-letter locale prefix, e.g. /es/podcasts/, /it/podcasts/.
const podcastRegex = /^\/(?:[a-z]{2}\/)?podcasts\/([^/]+)/

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
