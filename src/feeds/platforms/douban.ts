import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: interests, subject-reviews.
// Handler needed for: book-reviews, drama-reviews, movie-reviews, music-reviews, new-movie-reviews, notes, popular-reviews, reviews.

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
  { key: 'douban:interests', main: 'https://www.douban.com/feed/people/{username}/interests' },
  { key: 'douban:reviews', main: 'https://www.douban.com/feed/people/{username}/reviews' },
  { key: 'douban:notes', main: 'https://www.douban.com/feed/people/{username}/notes' },
  {
    key: 'douban:subject-reviews',
    main: 'https://www.douban.com/feed/subject/{subjectId}/reviews',
    aliases: [
      // A subject page links the feed on its section's host, which answers 301 to www.douban.com.
      'https://book.douban.com/feed/subject/{subjectId}/reviews',
      'https://movie.douban.com/feed/subject/{subjectId}/reviews',
      'https://music.douban.com/feed/subject/{subjectId}/reviews',
    ],
  },
  { key: 'douban:book-reviews', main: 'https://www.douban.com/feed/review/book' },
  { key: 'douban:movie-reviews', main: 'https://www.douban.com/feed/review/movie' },
  { key: 'douban:music-reviews', main: 'https://www.douban.com/feed/review/music' },
  { key: 'douban:drama-reviews', main: 'https://www.douban.com/feed/review/drama' },
  { key: 'douban:new-movie-reviews', main: 'https://www.douban.com/feed/review/movie_new' },
  { key: 'douban:popular-reviews', main: 'https://www.douban.com/feed/review/best' },
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

    // The category review feeds need no value from the page, so every page builds them after its
    // own feeds.
    if (parsed.kind === 'user') {
      const params = { username: parsed.username }

      return [
        feeds.getFeedEntry('douban:interests', params),
        feeds.getFeedEntry('douban:reviews', params),
        feeds.getFeedEntry('douban:notes', params),
        feeds.getFeedEntry('douban:book-reviews'),
        feeds.getFeedEntry('douban:movie-reviews'),
        feeds.getFeedEntry('douban:music-reviews'),
        feeds.getFeedEntry('douban:drama-reviews'),
        feeds.getFeedEntry('douban:new-movie-reviews'),
        feeds.getFeedEntry('douban:popular-reviews'),
      ]
    }

    if (parsed.kind === 'subject') {
      return [
        feeds.getFeedEntry('douban:subject-reviews', { subjectId: parsed.subjectId }),
        feeds.getFeedEntry('douban:book-reviews'),
        feeds.getFeedEntry('douban:movie-reviews'),
        feeds.getFeedEntry('douban:music-reviews'),
        feeds.getFeedEntry('douban:drama-reviews'),
        feeds.getFeedEntry('douban:new-movie-reviews'),
        feeds.getFeedEntry('douban:popular-reviews'),
      ]
    }

    return [
      feeds.getFeedEntry('douban:book-reviews'),
      feeds.getFeedEntry('douban:movie-reviews'),
      feeds.getFeedEntry('douban:music-reviews'),
      feeds.getFeedEntry('douban:drama-reviews'),
      feeds.getFeedEntry('douban:new-movie-reviews'),
      feeds.getFeedEntry('douban:popular-reviews'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
