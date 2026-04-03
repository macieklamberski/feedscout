import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

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
        uri: [`https://paragraph.com/@${username}/feed`, `https://paragraph.com/@${username}/rss`],
        hint: composeHint('paragraph:blog'),
      },
    ]
  },
}
