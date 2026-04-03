import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

const hosts = ['producthunt.com', 'www.producthunt.com']
const topicPattern = /^\/topics\/([a-zA-Z0-9_-]+)/
const categoryPattern = /^\/categories\/([a-zA-Z0-9_-]+)/

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Topic page: /topics/{topic}
    const topicMatch = pathname.match(topicPattern)

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
    const categoryMatch = pathname.match(categoryPattern)

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
