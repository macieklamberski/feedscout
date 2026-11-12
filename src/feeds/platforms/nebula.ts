import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers channel, explore, home, videos (html), partly covers videosCategory.

export type NebulaUrl = { kind: 'channel'; slug: string } | { kind: 'explore'; category?: string }

export const hosts = ['nebula.tv', 'www.nebula.tv']

// /explore is the canonical landing page (Nebula 301s root and /videos to it).
// Treated as the global feed surface, not a creator slug.
const globalPaths = ['videos', 'explore']

// Originals is also a category, so its row comes before the category row that would read it.
const feeds = definePlatformFeeds([
  { key: 'nebula:videos', template: 'https://rss.nebula.app/video/channels/{slug}.rss' },
  {
    key: 'nebula:videos-plus',
    template: 'https://rss.nebula.app/video/channels/{slug}.rss?plus=true',
  },
  { key: 'nebula:originals', template: 'https://rss.nebula.app/video/categories/originals.rss' },
  { key: 'nebula:category', template: 'https://rss.nebula.app/video/categories/{category}.rss' },
  {
    key: 'nebula:category-plus',
    template: 'https://rss.nebula.app/video/categories/{category}.rss?plus=true',
  },
  { key: 'nebula:videos-all', template: 'https://rss.nebula.app/video.rss' },
  { key: 'nebula:videos-all-plus', template: 'https://rss.nebula.app/video.rss?plus=true' },
  { key: 'nebula:channels', template: 'https://rss.nebula.app/video/channels.rss' },
])

export const parseNebulaUrl = (url: string): NebulaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [slug] = getPathSegments(parsedUrl)

  // The root, /videos and /explore[/{tab}], optionally filtered by category.
  if (!slug || isAnyOf(slug, globalPaths)) {
    return { kind: 'explore', category: getQueryParam(parsedUrl.searchParams, 'category') }
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
      const { category } = parsed
      const uris: Array<DiscoverUriEntry> = []

      if (category) {
        uris.push(feeds.getFeedEntry('nebula:category', { category }))
        uris.push(feeds.getFeedEntry('nebula:category-plus', { category }))
      }

      uris.push(feeds.getFeedEntry('nebula:videos-all'))
      uris.push(feeds.getFeedEntry('nebula:videos-all-plus'))
      uris.push(feeds.getFeedEntry('nebula:originals'))
      uris.push(feeds.getFeedEntry('nebula:channels'))

      return uris
    }

    const { slug } = parsed

    return [
      feeds.getFeedEntry('nebula:videos', { slug }),
      feeds.getFeedEntry('nebula:videos-plus', { slug }),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
