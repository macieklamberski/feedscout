import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'
import { excludedPaths, hosts } from '../../../feeds/platform/handlers/github.js'

export const githubHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const segments = pathname.split('/').filter(Boolean)

    if (segments.length === 0) {
      return []
    }

    const user = segments[0]

    if (isAnyOf(user, excludedPaths)) {
      return []
    }

    return [{ uri: `https://github.com/${user}.png` }]
  },
}
