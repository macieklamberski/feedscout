import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers channel, explore (html), partly covers home, videos.

export type NebulaUrl = { kind: 'channel'; slug: string } | { kind: 'explore'; category?: string }

export const hosts = ['nebula.tv', 'www.nebula.tv']
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
const globalPaths = ['videos', 'explore']

export const parseNebulaUrl = (url: string): NebulaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [slug] = getPathSegments(parsedUrl)

  // The root, /videos and /explore[/{tab}], optionally filtered by category.
  if (!slug || isAnyOf(slug, globalPaths)) {
    return { kind: 'explore', category: parsedUrl.searchParams.get('category') ?? undefined }
  }

  if (isAnyOf(slug, excludedPaths)) {
    return
  }

  return { kind: 'channel', slug }
}

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return parseNebulaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNebulaUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'explore') {
      const category = parsed.category?.toLowerCase()
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
        uri: 'https://rss.nebula.app/video/categories/originals.rss',
        hint: composeHint('nebula:originals'),
      })
      uris.push({
        uri: 'https://rss.nebula.app/video/channels.rss',
        hint: composeHint('nebula:channels'),
      })

      return uris
    }

    const { slug } = parsed
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
