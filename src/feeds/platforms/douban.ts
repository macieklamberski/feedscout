import { douban } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: interests, subject-reviews.
// Handler needed for: book-reviews, drama-reviews, movie-reviews, music-reviews, new-movie-reviews, notes, popular-reviews, reviews.

export type DoubanUrl =
  | { kind: 'user'; username: string }
  | { kind: 'subject'; subjectId: string }
  | { kind: 'home' }

const feeds = withHintLabels(douban.feeds)

export const parseDoubanUrl = (url: string): DoubanUrl | undefined => {
  const page = douban.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'user') {
    return { kind: 'user', username: page.values.username }
  }

  if (page.key === 'subject') {
    return { kind: 'subject', subjectId: page.values.subjectId }
  }

  return { kind: 'home' }
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
