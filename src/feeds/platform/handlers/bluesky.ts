import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['bsky.app']

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const profileMatch = pathname.match(/^\/profile\/([^/]+)/)
    const handle = profileMatch?.[1]

    if (!handle) {
      return []
    }

    return [`https://bsky.app/profile/${handle}/rss`]
  },
}
