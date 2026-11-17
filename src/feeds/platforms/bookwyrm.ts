import { getAnyOf, getPathSegments, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: activity, shelf.
// Handler needed for: comments, quotes, reviews.

export type BookwyrmUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'shelf'; username: string; section: string; shelf: string }
  | { kind: 'subpage'; username: string }

// The trailing boundary keeps sibling repositories such as `bookwyrm-docs` out.
const sourceLinkRegex = /github\.com\/bookwyrm-social\/bookwyrm(?![\w-])/i

const shelfSections = ['shelf', 'books']

// An instance runs on its own domain and is known only by its marker, so its feeds are built here
// but not claimed.
const feeds = definePlatformFeeds('bookwyrm', [
  { key: 'shelf', main: '{root}/user/{username}/{section}/{shelf}/rss' },
  { key: 'activity', main: '{root}/user/{username}/rss' },
  { key: 'reviews', main: '{root}/user/{username}/rss-reviews' },
  { key: 'quotes', main: '{root}/user/{username}/rss-quotes' },
  { key: 'comments', main: '{root}/user/{username}/rss-comments' },
])

export const isBookwyrmHtml = (content: string): boolean => {
  return sourceLinkRegex.test(content) || hasMetaContent(content, 'generator', 'BookWyrm')
}

export const parseBookwyrmUrl = (url: string): BookwyrmUrl | undefined => {
  const [prefix, username, section, shelf] = getPathSegments(url)

  if (!isAnyOf(prefix, 'user') || !username) {
    return
  }

  if (!section) {
    return { kind: 'profile', username }
  }

  const shelfSection = getAnyOf(section, shelfSections)

  if (shelfSection && shelf) {
    return { kind: 'shelf', username, section: shelfSection, shelf }
  }

  return { kind: 'subpage', username }
}

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isBookwyrmHtml })) {
      return false
    }

    return parseBookwyrmUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBookwyrmUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const { username } = parsed

    // Shelf page: /user/{username}/(shelf|books)/{shelf-id}, so the shelf feed goes first.
    if (parsed.kind === 'shelf') {
      return [
        page.getFeedEntry('shelf', {
          username,
          section: parsed.section,
          shelf: parsed.shelf,
        }),
        page.getFeedEntry('activity', { username }),
        page.getFeedEntry('reviews', { username }),
        page.getFeedEntry('quotes', { username }),
        page.getFeedEntry('comments', { username }),
      ]
    }

    return [
      page.getFeedEntry('activity', { username }),
      page.getFeedEntry('reviews', { username }),
      page.getFeedEntry('quotes', { username }),
      page.getFeedEntry('comments', { username }),
    ]
  },
}
