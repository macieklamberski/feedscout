import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Kickstarter exposes exactly two Atom feeds: per-project updates at
// `/projects/{creator}/{project}/posts.atom` and a global new-projects
// firehose at `/projects/feed.atom`. Categories, places, tags, profiles,
// search, and comments are HTML-only (with `.atom` suffix returning 406 or
// HTML behind Cloudflare), and the legacy `/blog.atom` was frozen in 2022.
// The handler maps any non-project URL to the global feed and project URLs
// to their `posts.atom`.

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
