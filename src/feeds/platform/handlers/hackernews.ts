import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Hacker News serves only two first-party RSS feeds — `/rss` (front page)
// and `/showrss` (Show HN) — and `news.ycombinator.com` pages do not link
// them via HTML `<link rel="alternate">` or HTTP Link headers. The handler
// is required to map the homepage and `/show`/`/shownew` paths onto these
// two endpoints; broader section, user, and thread feeds live on the
// third-party `hnrss.org` gateway and are out of scope.

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
