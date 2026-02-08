import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['lobste.rs']
const tagPathRegex = /^\/t\/([a-zA-Z0-9,_-]+)/
const domainPathRegex = /^\/domains\/([^/]+)/
const userPathRegex = /^\/~([a-zA-Z0-9_-]+)/
const topPathRegex = /^\/top(?:\/(1d|3d|1w|1m|1y))?\/?$/

export const lobstersHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Tag page: /t/{tag} or /t/{tag1},{tag2}
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      const tags = tagMatch[1]

      return [
        { uri: `https://lobste.rs/t/${tags}.rss`, hint: { key: 'lobsters:tag', label: 'Tag' } },
      ]
    }

    // Domain page: /domains/{domain}
    const domainMatch = pathname.match(domainPathRegex)

    if (domainMatch?.[1]) {
      const domain = domainMatch[1]

      return [
        {
          uri: `https://lobste.rs/domains/${domain}.rss`,
          hint: { key: 'lobsters:domain', label: 'Domain' },
        },
      ]
    }

    // User page: /~{username}
    const userMatch = pathname.match(userPathRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      return [
        {
          uri: `https://lobste.rs/~${username}/stories.rss`,
          hint: { key: 'lobsters:stories', label: 'Stories' },
        },
      ]
    }

    // Top stories page: /top or /top/{period}
    const topMatch = pathname.match(topPathRegex)

    if (topMatch) {
      const period = topMatch[1]

      if (period) {
        return [
          {
            uri: `https://lobste.rs/top/${period}/rss`,
            hint: { key: 'lobsters:top', label: 'Top stories' },
          },
        ]
      }

      return [
        { uri: 'https://lobste.rs/top/rss', hint: { key: 'lobsters:top', label: 'Top stories' } },
      ]
    }

    // Newest page.
    if (pathname === '/newest' || pathname === '/newest/') {
      return [
        { uri: 'https://lobste.rs/newest.rss', hint: { key: 'lobsters:newest', label: 'Newest' } },
      ]
    }

    // Comments page.
    if (pathname === '/comments' || pathname === '/comments/') {
      return [
        {
          uri: 'https://lobste.rs/comments.rss',
          hint: { key: 'lobsters:comments', label: 'Comments' },
        },
      ]
    }

    // Homepage or other pages - return main feed.
    return [{ uri: 'https://lobste.rs/rss', hint: { key: 'lobsters:stories', label: 'Stories' } }]
  },
}
