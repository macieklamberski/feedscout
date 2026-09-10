import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Douban publishes RSS 2.0 feeds at well-known `/feed/people/{user}/...`,
// `/feed/subject/{id}/reviews`, and `/feed/review/{category}` paths, and
// the corresponding HTML pages link them. The handler is kept to map
// `/people/{user}`, `/subject/{id}`, and the homepage onto the canonical
// feed URIs and to emit the multiple per-user variants (interests,
// reviews, notes) in one resolve call.

const userRegex = /^\/people\/([^/]+)/
const subjectRegex = /^\/subject\/(\d+)/

export const doubanHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, 'douban.com') || isSubdomainOf(url, 'douban.com')
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // User page: /people/{user}/
    const userMatch = pathname.match(userRegex)

    if (userMatch?.[1]) {
      const user = userMatch[1]

      return [
        {
          uri: `https://www.douban.com/feed/people/${user}/interests`,
          hint: composeHint('douban:interests'),
        },
        {
          uri: `https://www.douban.com/feed/people/${user}/reviews`,
          hint: composeHint('douban:reviews'),
        },
        {
          uri: `https://www.douban.com/feed/people/${user}/notes`,
          hint: composeHint('douban:notes'),
        },
      ]
    }

    // Subject page: /subject/{id}/
    const subjectMatch = pathname.match(subjectRegex)

    if (subjectMatch?.[1]) {
      const id = subjectMatch[1]

      return [
        {
          uri: `https://www.douban.com/feed/subject/${id}/reviews`,
          hint: composeHint('douban:subjectReviews'),
        },
      ]
    }

    // Root page: category review feeds.
    if (pathname === '/' || pathname === '') {
      return [
        {
          uri: 'https://www.douban.com/feed/review/book',
          hint: composeHint('douban:reviews'),
        },
        {
          uri: 'https://www.douban.com/feed/review/movie',
          hint: composeHint('douban:reviews'),
        },
        {
          uri: 'https://www.douban.com/feed/review/music',
          hint: composeHint('douban:reviews'),
        },
        {
          uri: 'https://www.douban.com/feed/review/drama',
          hint: composeHint('douban:reviews'),
        },
      ]
    }

    return []
  },
}
