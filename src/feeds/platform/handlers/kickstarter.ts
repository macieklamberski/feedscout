import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['kickstarter.com', 'www.kickstarter.com']

export const kickstarterHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Project page: kickstarter.com/projects/{creator}/{project}
    if (pathSegments.length >= 3 && pathSegments[0] === 'projects') {
      const creator = pathSegments[1]
      const project = pathSegments[2]

      return [`https://www.kickstarter.com/projects/${creator}/${project}/posts.atom`]
    }

    // Homepage or discover pages - return global new projects feed.
    return ['https://www.kickstarter.com/projects/feed.atom']
  },
}
