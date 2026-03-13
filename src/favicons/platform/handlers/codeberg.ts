import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/codeberg.js'

export const codebergHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return []
    }

    const username = segments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [{ uri: `${origin}/user/avatar/${username}/512` }]
  },
}
