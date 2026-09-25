import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, news, show (guess, html).
// Handler needed for: shownew.

const hosts = ['news.ycombinator.com']

const showRegex = /^\/show(?:new)?\/?$/

export const hackernewsHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Show HN section.
    if (showRegex.test(pathname)) {
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
