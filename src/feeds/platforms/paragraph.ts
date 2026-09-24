import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['paragraph.com', 'www.paragraph.com']
const userRegex = /^\/@([^/]+)/

export const paragraphHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (!userMatch?.[1]) {
      return []
    }

    const username = userMatch[1]

    return [
      {
        uri: `https://api.paragraph.com/blogs/rss/@${username}`,
        hint: composeHint('paragraph:blog'),
      },
    ]
  },
}
