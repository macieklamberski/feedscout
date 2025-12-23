import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const hosts = ['medium.com', 'www.medium.com']
const excludedPaths = ['search', 'me', 'new-story', 'plans', 'membership']

export const mediumHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) || isSubdomainOf(url, 'medium.com')
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)
    const lowerHostname = hostname.toLowerCase()

    // Medium.com user profiles: /@username.
    if (hosts.includes(lowerHostname)) {
      // User profile: /@username.
      const userMatch = pathname.match(/^\/@([^/]+)/)

      if (userMatch?.[1]) {
        const username = userMatch[1]

        return [`https://medium.com/feed/@${username}`]
      }

      // Tag feed: /tag/tag-name.
      const tagMatch = pathname.match(/^\/tag\/([^/]+)/)

      if (tagMatch?.[1]) {
        const tag = tagMatch[1]

        return [`https://medium.com/feed/tag/${tag}`]
      }

      // Publication: /publication-name.
      const pubMatch = pathname.match(/^\/([^/@][^/]+)/)

      if (pubMatch?.[1]) {
        const publication = pubMatch[1]

        if (!isAnyOf(publication, excludedPaths)) {
          return [`https://medium.com/feed/${publication}`]
        }
      }
    }

    // Custom domain: subdomain.medium.com (excluding www).
    if (
      lowerHostname.endsWith('.medium.com') &&
      lowerHostname !== 'medium.com' &&
      lowerHostname !== 'www.medium.com'
    ) {
      const subdomain = lowerHostname.replace('.medium.com', '')

      return [`https://medium.com/feed/${subdomain}`]
    }

    return []
  },
}
