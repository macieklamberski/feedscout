import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['producthunt.com', 'www.producthunt.com']
const topicPathRegex = /^\/topics\/([a-zA-Z0-9_-]+)/
const categoryPathRegex = /^\/categories\/([a-zA-Z0-9_-]+)/

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Topic page: /topics/{topic}
    const topicMatch = pathname.match(topicPathRegex)

    if (topicMatch?.[1]) {
      const topic = topicMatch[1]

      return [`https://www.producthunt.com/feed?topic=${topic}`]
    }

    // Category page: /categories/{category}
    const categoryMatch = pathname.match(categoryPathRegex)

    if (categoryMatch?.[1]) {
      const category = categoryMatch[1]

      return [`https://www.producthunt.com/feed?category=${category}`]
    }

    // Homepage or other pages - return main feed.
    return ['https://www.producthunt.com/feed']
  },
}
