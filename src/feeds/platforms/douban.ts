import { douban } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
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
const hosts = douban.hosts.exact

const userRegex = /^\/people\/([^/]+)/i
const subjectRegex = /^\/subject\/(?<subjectId>[^/]+)/i

const feeds = withHintLabels(douban.feeds)

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
        feeds.getFeedEntry('interests', params),
        feeds.getFeedEntry('reviews', params),
        feeds.getFeedEntry('notes', params),
        feeds.getFeedEntry('book-reviews'),
        feeds.getFeedEntry('movie-reviews'),
        feeds.getFeedEntry('music-reviews'),
        feeds.getFeedEntry('drama-reviews'),
        feeds.getFeedEntry('new-movie-reviews'),
        feeds.getFeedEntry('popular-reviews'),
      ]
    }

    if (parsed.kind === 'subject') {
      return [
        feeds.getFeedEntry('subject-reviews', { subjectId: parsed.subjectId }),
        feeds.getFeedEntry('book-reviews'),
        feeds.getFeedEntry('movie-reviews'),
        feeds.getFeedEntry('music-reviews'),
        feeds.getFeedEntry('drama-reviews'),
        feeds.getFeedEntry('new-movie-reviews'),
        feeds.getFeedEntry('popular-reviews'),
      ]
    }

    return [
      feeds.getFeedEntry('book-reviews'),
      feeds.getFeedEntry('movie-reviews'),
      feeds.getFeedEntry('music-reviews'),
      feeds.getFeedEntry('drama-reviews'),
      feeds.getFeedEntry('new-movie-reviews'),
      feeds.getFeedEntry('popular-reviews'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
