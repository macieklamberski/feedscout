import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['kickstarter.com', 'www.kickstarter.com']

export const kickstarterHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Only match project pages: /projects/{creator}/{project}
    return pathSegments.length >= 3 && pathSegments[0] === 'projects'
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Project page: kickstarter.com/projects/{creator}/{project}
    if (pathSegments.length >= 3 && pathSegments[0] === 'projects') {
      const creator = pathSegments[1]
      const project = pathSegments[2]

      return [`${origin}/projects/${creator}/${project}/posts.atom`]
    }

    return []
  },
}
