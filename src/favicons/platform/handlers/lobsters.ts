import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'
import { hosts } from '../../../feeds/platform/handlers/lobsters.js'

const userRegex = /^\/~([a-zA-Z0-9_-]+)/

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)

      return isHostOf(url, hosts) && userRegex.test(pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(userRegex)

    if (!match?.[1]) {
      return []
    }

    const username = match[1]

    return [{ uri: `https://lobste.rs/avatars/${username}-100.png` }]
  },
}
