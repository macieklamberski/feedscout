import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Not discoverable without handler.

const hosts = ['news.ycombinator.com']

export const hackernewsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Show HN section.
    if (pathname === '/show' || pathname === '/shownew') {
      return [
        {
          uri: 'https://news.ycombinator.com/showrss',
          hint: composeHint('hackernews:show'),
        },
      ]
    }

    // Default: front page feed.
    return [
      {
        uri: 'https://news.ycombinator.com/rss',
        hint: composeHint('hackernews:front'),
      },
    ]
  },
}
