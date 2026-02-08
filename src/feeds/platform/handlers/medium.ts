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

        return [
          {
            uri: `https://medium.com/feed/@${username}`,
            hint: { key: 'medium:posts', label: 'Posts' },
          },
        ]
      }

      // Tag feed: /tag/tag-name.
      const tagMatch = pathname.match(/^\/tag\/([^/]+)/)

      if (tagMatch?.[1]) {
        const tag = tagMatch[1]

        return [
          { uri: `https://medium.com/feed/tag/${tag}`, hint: { key: 'medium:tag', label: 'Tag' } },
        ]
      }

      // Publication tagged feed: /publication/tagged/tag-name.
      const pubTagMatch = pathname.match(/^\/([^/@][^/]+)\/tagged\/([^/]+)/)

      if (pubTagMatch?.[1] && pubTagMatch?.[2]) {
        const publication = pubTagMatch[1]
        const tag = pubTagMatch[2]

        if (!isAnyOf(publication, excludedPaths)) {
          return [
            {
              uri: `https://medium.com/feed/${publication}/tagged/${tag}`,
              hint: { key: 'medium:tagged', label: 'Tagged' },
            },
          ]
        }
      }

      // Publication: /publication-name.
      const pubMatch = pathname.match(/^\/([^/@][^/]+)/)

      if (pubMatch?.[1]) {
        const publication = pubMatch[1]

        if (!isAnyOf(publication, excludedPaths)) {
          return [
            {
              uri: `https://medium.com/feed/${publication}`,
              hint: { key: 'medium:publication', label: 'Publication' },
            },
          ]
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

      // Subdomain tagged feed: subdomain.medium.com/tagged/tag-name.
      const tagMatch = pathname.match(/^\/tagged\/([^/]+)/)

      if (tagMatch?.[1]) {
        return [
          {
            uri: `https://medium.com/feed/${subdomain}/tagged/${tagMatch[1]}`,
            hint: { key: 'medium:tagged', label: 'Tagged' },
          },
        ]
      }

      return [
        {
          uri: `https://medium.com/feed/${subdomain}`,
          hint: { key: 'medium:publication', label: 'Publication' },
        },
      ]
    }

    return []
  },
}
