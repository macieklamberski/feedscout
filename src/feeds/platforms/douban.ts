import { isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers subject (html), partly covers people.
// Handler needed for: book, home, movie, music.

export type DoubanUrl =
  | { kind: 'user'; username: string }
  | { kind: 'subject'; subjectId: string }
  | { kind: 'home' }

const domains = ['douban.com']
const userRegex = /^\/people\/([^/]+)/i
const subjectRegex = /^\/subject\/(\d+)/i

export const parseDoubanUrl = (url: string): DoubanUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  // User page: /people/{user}/
  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  // Subject page: /subject/{id}/
  const subjectId = pathname.match(subjectRegex)?.[1]

  if (subjectId) {
    return { kind: 'subject', subjectId }
  }

  if (pathname === '/') {
    return { kind: 'home' }
  }
}

export const doubanHandler: PlatformHandler = {
  match: (url) => {
    return parseDoubanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseDoubanUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      const { username } = parsed

      return [
        {
          uri: `https://www.douban.com/feed/people/${username}/interests`,
          hint: composeHint('douban:interests'),
        },
        {
          uri: `https://www.douban.com/feed/people/${username}/reviews`,
          hint: composeHint('douban:reviews'),
        },
        {
          uri: `https://www.douban.com/feed/people/${username}/notes`,
          hint: composeHint('douban:notes'),
        },
      ]
    }

    if (parsed.kind === 'subject') {
      return [
        {
          uri: `https://www.douban.com/feed/subject/${parsed.subjectId}/reviews`,
          hint: composeHint('douban:subjectReviews'),
        },
      ]
    }

    // Root page: category review feeds.
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
  },
}
