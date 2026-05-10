import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Partially discoverable without handler.

const hosts = ['nebula.tv', 'www.nebula.tv']
const excludedPaths = [
  'about',
  'classes',
  'library',
  'login',
  'pricing',
  'privacy',
  'search',
  'settings',
  'signup',
  'terms',
]

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Root or /videos — global feed (optionally filtered by category).
    if (pathSegments.length === 0 || pathSegments[0] === 'videos') {
      const category = searchParams.get('category')
      const uris: Array<DiscoverUriEntry> = []

      if (category) {
        uris.push({
          uri: `https://rss.nebula.app/video/categories/${category}.rss`,
          hint: composeHint('nebula:category'),
        })
        uris.push({
          uri: `https://rss.nebula.app/video/categories/${category}.rss?plus=true`,
          hint: composeHint('nebula:category-plus'),
        })
      }

      uris.push({
        uri: 'https://rss.nebula.app/video.rss',
        hint: composeHint('nebula:videos-all'),
      })
      uris.push({
        uri: 'https://rss.nebula.app/video.rss?plus=true',
        hint: composeHint('nebula:videos-all-plus'),
      })

      return uris
    }

    const slug = pathSegments[0]

    if (isAnyOf(slug, excludedPaths)) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    uris.push({
      uri: `https://rss.nebula.app/video/channels/${slug}.rss`,
      hint: composeHint('nebula:videos'),
    })
    uris.push({
      uri: `https://rss.nebula.app/video/channels/${slug}.rss?plus=true`,
      hint: composeHint('nebula:videos-plus'),
    })

    return uris
  },
}
