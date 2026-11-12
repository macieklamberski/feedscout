import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

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

const feeds = definePlatformFeeds([
  {
    key: 'douban:interests',
    template: 'https://www.douban.com/feed/people/{username}/interests',
  },
  { key: 'douban:reviews', template: 'https://www.douban.com/feed/people/{username}/reviews' },
  { key: 'douban:notes', template: 'https://www.douban.com/feed/people/{username}/notes' },
  {
    key: 'douban:subject-reviews',
    template: 'https://www.douban.com/feed/subject/{subjectId}/reviews',
  },
  { key: 'douban:book-reviews', template: 'https://www.douban.com/feed/review/book' },
  { key: 'douban:movie-reviews', template: 'https://www.douban.com/feed/review/movie' },
  { key: 'douban:music-reviews', template: 'https://www.douban.com/feed/review/music' },
  { key: 'douban:drama-reviews', template: 'https://www.douban.com/feed/review/drama' },
])

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
      const params = { username: parsed.username }

      return [
        feeds.getFeedEntry('douban:interests', params),
        feeds.getFeedEntry('douban:reviews', params),
        feeds.getFeedEntry('douban:notes', params),
      ]
    }

    if (parsed.kind === 'subject') {
      return [feeds.getFeedEntry('douban:subject-reviews', { subjectId: parsed.subjectId })]
    }

    // Root page: category review feeds.
    return [
      feeds.getFeedEntry('douban:book-reviews'),
      feeds.getFeedEntry('douban:movie-reviews'),
      feeds.getFeedEntry('douban:music-reviews'),
      feeds.getFeedEntry('douban:drama-reviews'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
