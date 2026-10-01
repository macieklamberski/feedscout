import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers player, show (html).
// Handler needed for: embed.

export type AcastUrl = { kind: 'show'; slug: string }

// shows.acast.com is the canonical web host. play.acast.com is a legacy host that
// 302-redirects to shows.acast.com (slug at path index 1, after /s/). embed.acast.com
// is the embed-player host (slug at path index 0).
const hosts = ['shows.acast.com', 'play.acast.com', 'embed.acast.com']
const legacyHosts = ['play.acast.com']
const excludedPaths = ['discover']

export const parseAcastUrl = (url: string): AcastUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  // play.acast.com keeps the slug after /s/: play.acast.com/s/{slug}.
  const slugIndex = isHostOf(url, legacyHosts) ? 1 : 0
  const slug = getPathSegments(url)[slugIndex]

  if (!slug || isAnyOf(slug, excludedPaths)) {
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

    return [
      {
        uri: `https://feeds.acast.com/public/shows/${parsed.slug}`,
        hint: composeHint('acast:podcast'),
      },
    ]
  },
}
