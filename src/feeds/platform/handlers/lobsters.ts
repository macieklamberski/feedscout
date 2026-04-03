import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

export const hosts = ['lobste.rs']
const tagPattern = /^\/t\/([a-zA-Z0-9,_-]+)/
const domainPattern = /^\/domains\/([^/]+)/
const userPattern = /^\/~([a-zA-Z0-9_-]+)/
const topPattern = /^\/top(?:\/(1d|3d|1w|1m|1y))?\/?$/

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Tag page: /t/{tag} or /t/{tag1},{tag2}
    const tagMatch = pathname.match(tagPattern)

    if (tagMatch?.[1]) {
      const tags = tagMatch[1]

      return [{ uri: `https://lobste.rs/t/${tags}.rss`, hint: composeHint('lobsters:tag') }]
    }

    // Domain page: /domains/{domain}
    const domainMatch = pathname.match(domainPattern)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [
        {
          uri: `https://lobste.rs/domains/${domain}.rss`,
          hint: composeHint('lobsters:domain'),
        },
      ]
    }

    // User page: /~{username}
    const userMatch = pathname.match(userPattern)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      return [
        {
          uri: `https://lobste.rs/~${username}/stories.rss`,
          hint: composeHint('lobsters:stories'),
        },
      ]
    }

    // Top stories page: /top or /top/{period}
    const topMatch = pathname.match(topPattern)

    if (topMatch) {
      const period = topMatch[1]

      if (period) {
        return [
          {
            uri: `https://lobste.rs/top/${period}/rss`,
            hint: composeHint('lobsters:top'),
          },
        ]
      }

      return [{ uri: 'https://lobste.rs/top/rss', hint: composeHint('lobsters:top') }]
    }

    // Newest page.
    if (pathname === '/newest' || pathname === '/newest/') {
      return [{ uri: 'https://lobste.rs/newest.rss', hint: composeHint('lobsters:newest') }]
    }

    // Comments page.
    if (pathname === '/comments' || pathname === '/comments/') {
      return [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: composeHint('lobsters:comments'),
        },
      ]
    }

    // Homepage or other pages - return main feed.
    return [{ uri: 'https://lobste.rs/rss', hint: composeHint('lobsters:stories') }]
  },
}
