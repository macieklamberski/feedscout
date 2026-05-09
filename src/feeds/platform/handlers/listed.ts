import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const hosts = ['listed.to', 'www.listed.to']
const userRegex = /^\/@([^/]+)/

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(userRegex)

    if (!userMatch?.[1]) {
      return []
    }

    return [
      {
        uri: `https://listed.to/@${userMatch[1]}/feed.rss`,
        hint: composeHint('listed:blog'),
      },
    ]
  },
}
