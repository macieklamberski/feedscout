import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic covers player, show (html).
// Handler needed for: embed, legacy-player.

export type AcastUrl = { kind: 'show'; slug: string }

// shows.acast.com is the canonical web host. play.acast.com is a legacy host that
// 302-redirects to shows.acast.com (slug at path index 1, after /s/). embed.acast.com
// and the older player.acast.com, which 302-redirects to it, put the slug at path index 0.
const hosts = ['shows.acast.com', 'play.acast.com', 'embed.acast.com', 'player.acast.com']
const legacyHosts = ['play.acast.com']

// feeds.acast.com serves a show by slug or by id. It stays out of `hosts`, where the first path
// segment would read as the slug.
const feeds = definePlatformFeeds([
  { key: 'acast:podcast', template: 'https://feeds.acast.com/public/shows/{slug}' },
])

export const parseAcastUrl = (url: string): AcastUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  // play.acast.com keeps the slug after /s/: play.acast.com/s/{slug}.
  const slugIndex = isHostOf(url, legacyHosts) ? 1 : 0
  const allSegments = getPathSegments(url)
  // The current embed code writes `embed.acast.com/$/{slug}/{episode}`.
  const segments = allSegments[0] === '$' ? allSegments.slice(1) : allSegments
  const [slug] = segments.slice(slugIndex)

  if (!slug) {
    return
  }

  return { kind: 'show', slug }
}

export const acastHandler: PlatformHandler = {
  match: (url) => {
    return parseAcastUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAcastUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('acast:podcast', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
