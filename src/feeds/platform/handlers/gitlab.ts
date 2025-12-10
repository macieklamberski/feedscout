import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['gitlab.com', 'www.gitlab.com']

export const gitlabHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // User/org page: gitlab.com/{user}
    if (pathSegments.length === 1) {
      const user = pathSegments[0]

      return [`${origin}/${user}.atom`]
    }

    // Repo page: gitlab.com/{user}/{repo}
    if (pathSegments.length >= 2) {
      const user = pathSegments[0]
      const repo = pathSegments[1]

      return [`${origin}/${user}/${repo}.atom`]
    }

    return []
  },
}
