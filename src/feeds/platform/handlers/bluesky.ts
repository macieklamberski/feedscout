import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const profileRegex = /^\/profile\/([^/]+)/

const hosts = ['bsky.app', 'www.bsky.app']

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const profileMatch = pathname.match(profileRegex)
    const handle = profileMatch?.[1]

    if (!handle) {
      return []
    }

    return [
      {
        uri: `https://bsky.app/profile/${handle}/rss`,
        hint: composeHint('bluesky:posts'),
      },
    ]
  },
}
