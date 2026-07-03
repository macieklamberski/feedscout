import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

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

      return [
        {
          uri: `https://www.kickstarter.com/projects/${creator}/${project}/posts.atom`,
          hint: composeHint('kickstarter:updates'),
        },
      ]
    }

    // Homepage or discover pages - return global new projects feed.
    return [
      {
        uri: 'https://www.kickstarter.com/projects/feed.atom',
        hint: composeHint('kickstarter:projects'),
      },
    ]
  },
}
