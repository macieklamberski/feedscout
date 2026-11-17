import { getPathSegments, getQueryParam, isAnyOf, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, category-plus, videos, videos-plus.
// Handler needed for: channels, originals, videos-all, videos-all-plus.

export type NebulaUrl = { kind: 'channel'; slug: string } | { kind: 'explore'; category?: string }

export const hosts = ['nebula.tv', 'www.nebula.tv']

// /explore is the canonical landing page (Nebula 301s root and /videos to it).
// Treated as the global feed surface, not a creator slug.
const globalPaths = ['videos', 'explore']

// Originals is also a category, so its row comes before the category row that would read it.
const feeds = definePlatformFeeds('nebula', [
  { key: 'videos', main: 'https://rss.nebula.app/video/channels/{slug}.rss' },
  { key: 'videos-plus', main: 'https://rss.nebula.app/video/channels/{slug}.rss?plus=true' },
  { key: 'originals', main: 'https://rss.nebula.app/video/categories/originals.rss' },
  { key: 'category', main: 'https://rss.nebula.app/video/categories/{category}.rss' },
  {
    key: 'category-plus',
    main: 'https://rss.nebula.app/video/categories/{category}.rss?plus=true',
  },
  { key: 'videos-all', main: 'https://rss.nebula.app/video.rss' },
  { key: 'videos-all-plus', main: 'https://rss.nebula.app/video.rss?plus=true' },
  { key: 'channels', main: 'https://rss.nebula.app/video/channels.rss' },
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

      if (category) {
        return [
          feeds.getFeedEntry('category', { category }),
          feeds.getFeedEntry('category-plus', { category }),
          feeds.getFeedEntry('videos-all'),
          feeds.getFeedEntry('videos-all-plus'),
          feeds.getFeedEntry('originals'),
          feeds.getFeedEntry('channels'),
        ]
      }

      return [
        feeds.getFeedEntry('videos-all'),
        feeds.getFeedEntry('videos-all-plus'),
        feeds.getFeedEntry('originals'),
        feeds.getFeedEntry('channels'),
      ]
    }

    const { slug } = parsed

    return [feeds.getFeedEntry('videos', { slug }), feeds.getFeedEntry('videos-plus', { slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
