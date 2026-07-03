import { isAnyOf, isHostOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

const hosts = ['nebula.tv', 'www.nebula.tv']
const excludedPaths = [
  'about',
  'classes',
  'library',
  'login',
  'originals',
  'pricing',
  'privacy',
  'search',
  'settings',
  'signup',
  'terms',
]

// /explore is the canonical landing page (Nebula 301s root and /videos to it).
// Treated as the global feed surface, not a creator slug.
const globalPaths = new Set(['videos', 'explore'])

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname, searchParams } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Root, /videos, or /explore[/{tab}] — global feed (optionally filtered by category).
    if (pathSegments.length === 0 || globalPaths.has(pathSegments[0])) {
      const rawCategory = searchParams.get('category')
      const category = rawCategory ? rawCategory.toLowerCase() : null
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
      uris.push({
        uri: 'https://rss.nebula.app/video/channels.rss',
        hint: composeHint('nebula:channels'),
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
