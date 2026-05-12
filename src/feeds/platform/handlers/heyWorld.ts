import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// HEY World exposes exactly one Atom feed per author at
// `world.hey.com/{user}/feed.atom`, advertised via a single
// `<link rel="alternate" type="application/atom+xml">` in the blog HTML head.
// There is no JSON Feed, no RSS variant, no sitewide feed, no per-post
// comments feed, and no topic/tag scoping — every other format returns
// HTTP 406. The handler short-circuits the discovery fetch.

export const heyWorldHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, 'world.hey.com')
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    return [
      {
        uri: `https://world.hey.com/${username}/feed.atom`,
        hint: composeHint('hey-world:blog'),
      },
    ]
  },
}
