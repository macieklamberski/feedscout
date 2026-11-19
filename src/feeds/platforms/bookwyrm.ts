import { bookwyrm } from 'feedintel'
import { getAnyOf, getPathSegments, isAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
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

const feeds = withHintLabels(bookwyrm.feeds)

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
