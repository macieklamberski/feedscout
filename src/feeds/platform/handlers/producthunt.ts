import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Product Hunt publishes a single global Atom firehose at
// `producthunt.com/feed`, the only functional feed surface; topic and
// category pages have no autodiscoverable per-slug feed and the
// `?topic=`/`?category=` query parameters are silently ignored for current
// taxonomy slugs. The handler maps topic and category URLs to those
// (largely no-op) query variants and falls back to the global feed for
// every other matched page.

const hosts = ['producthunt.com', 'www.producthunt.com']
const topicRegex = /^\/topics\/([a-zA-Z0-9_-]+)/
const categoryRegex = /^\/categories\/([a-zA-Z0-9_-]+)/

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Topic page: /topics/{topic}
    const topicMatch = pathname.match(topicRegex)

    if (topicMatch?.[1]) {
      const topic = topicMatch[1]

      return [
        {
          uri: `https://www.producthunt.com/feed?topic=${topic}`,
          hint: composeHint('producthunt:topic'),
        },
      ]
    }

    // Category page: /categories/{category}
    const categoryMatch = pathname.match(categoryRegex)

    if (categoryMatch?.[1]) {
      const category = categoryMatch[1]

      return [
        {
          uri: `https://www.producthunt.com/feed?category=${category}`,
          hint: composeHint('producthunt:category'),
        },
      ]
    }

    // Homepage or other pages - return main feed.
    return [
      {
        uri: 'https://www.producthunt.com/feed',
        hint: composeHint('producthunt:products'),
      },
    ]
  },
}
