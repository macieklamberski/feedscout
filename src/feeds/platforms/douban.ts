import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers subject (html), partly covers people.
// Handler needed for: book, home, movie, music.

export type DoubanUrl =
  | { kind: 'user'; username: string }
  | { kind: 'subject'; subjectId: string }
  | { kind: 'home' }

// The sections that serve profile and subject pages. Other subdomains are service hosts, such
// as accounts and api.
const hosts = [
  'douban.com',
  'www.douban.com',
  'book.douban.com',
  'm.douban.com',
  'movie.douban.com',
  'music.douban.com',
]
const userRegex = /^\/people\/([^/]+)/i
const subjectRegex = /^\/subject\/(?<subjectId>[^/]+)/i

export const parseDoubanUrl = (url: string): DoubanUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  // User page: /people/{user}/
  const username = pathname.match(userRegex)?.[1]

  if (username) {
    return { kind: 'user', username }
  }

  // Subject page: /subject/{id}/
  const subjectId = pathname.match(subjectRegex)?.groups?.subjectId

  if (subjectId && digitsRegex.test(subjectId)) {
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
          hint: composeHint('douban:subject-reviews'),
        },
      ]
    }

    // Root page: category review feeds.
    return [
      {
        uri: 'https://www.douban.com/feed/review/book',
        hint: composeHint('douban:book-reviews'),
      },
      {
        uri: 'https://www.douban.com/feed/review/movie',
        hint: composeHint('douban:movie-reviews'),
      },
      {
        uri: 'https://www.douban.com/feed/review/music',
        hint: composeHint('douban:music-reviews'),
      },
      {
        uri: 'https://www.douban.com/feed/review/drama',
        hint: composeHint('douban:drama-reviews'),
      },
    ]
  },
}
