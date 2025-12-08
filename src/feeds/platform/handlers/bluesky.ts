import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf } from '../../../common/utils.js'

const hosts = ['bsky.app']

const defaultBridgeUrl = 'https://bsky.link/api/rss'

export const blueskyHandler: PlatformHandler = {
  match: (url) => isAnyOf(new URL(url).hostname, hosts),

  resolve: (url) => {
    const { pathname } = new URL(url)
    const profileMatch = pathname.match(/^\/profile\/([^/]+)/)

    if (!profileMatch?.[1]) {
      return []
    }

    const handle = profileMatch[1]

    return [`${defaultBridgeUrl}/${handle}`]
  },
}
