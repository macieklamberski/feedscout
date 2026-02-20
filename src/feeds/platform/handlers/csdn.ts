import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['blog.csdn.net']

export const csdnHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const userMatch = pathname.match(/^\/([^/]+)/)
    const username = userMatch?.[1]

    if (!username) {
      return []
    }

    return [
      {
        uri: [
          `https://rss.csdn.net/${username}/rss/map`,
          `https://blog.csdn.net/${username}/rss/list`,
        ],
        hint: composeHint('csdn:blog'),
      },
    ]
  },
}
