import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hosts } from '../../feeds/platforms/lobsters.js'

const userRegex = /^\/~([a-zA-Z0-9_-]+)/

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    return isHostOf(url, hosts) && userRegex.test(pathname)
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
