import type { PlatformHandler } from '../../../common/uris/platform/types.js'

const hosts = ['medium.com', 'www.medium.com']

const skipPaths = ['tag', 'search', 'me', 'new-story', 'plans', 'membership']

export const mediumHandler: PlatformHandler = {
  match: (url) => {
    const hostname = new URL(url).hostname.toLowerCase()

    return hosts.includes(hostname) || hostname.endsWith('.medium.com')
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)
    const lowerHostname = hostname.toLowerCase()

    // Medium.com user profiles: /@username.
    if (lowerHostname === 'medium.com' || lowerHostname === 'www.medium.com') {
      // User profile: /@username.
      const userMatch = pathname.match(/^\/@([^/]+)/)

      if (userMatch?.[1]) {
        const username = userMatch[1]

        return [`https://medium.com/feed/@${username}`]
      }

      // Publication: /publication-name.
      const pubMatch = pathname.match(/^\/([^/@][^/]+)/)

      if (pubMatch?.[1]) {
        const publication = pubMatch[1]

        if (!skipPaths.includes(publication.toLowerCase())) {
          return [`https://medium.com/feed/${publication}`]
        }
      }
    }

    // Custom domain: subdomain.medium.com.
    if (lowerHostname.endsWith('.medium.com') && lowerHostname !== 'medium.com') {
      const subdomain = lowerHostname.replace('.medium.com', '')

      return [`https://medium.com/feed/${subdomain}`]
    }

    return []
  },
}
