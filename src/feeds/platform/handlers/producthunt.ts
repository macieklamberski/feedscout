import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

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
