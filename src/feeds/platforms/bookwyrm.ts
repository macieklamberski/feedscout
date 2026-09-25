import { getPathSegments } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers profile, shelf.

export type BookwyrmUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'shelf'; username: string; section: string; shelf: string }
  | { kind: 'subpage'; username: string }

// The trailing boundary keeps sibling repositories such as `bookwyrm-docs` out.
const sourceLinkRegex = /github\.com\/bookwyrm-social\/bookwyrm(?![\w-])/

const shelfSections = ['shelf', 'books']

export const isBookwyrmHtml = (content: string): boolean => {
  return sourceLinkRegex.test(content) || hasMetaContent(content, 'generator', 'BookWyrm')
}

export const parseBookwyrmUrl = (url: string): BookwyrmUrl | undefined => {
  const [prefix, username, section, shelf] = getPathSegments(url)

  if (prefix !== 'user' || !username) {
    return
  }

  if (!section) {
    return { kind: 'profile', username }
  }

  if (shelfSections.includes(section) && shelf) {
    return { kind: 'shelf', username, section, shelf }
  }

  return { kind: 'subpage', username }
}

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isBookwyrmHtml(content)) {
      return false
    }

    return parseBookwyrmUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseBookwyrmUrl(url)

    if (!parsed) {
      return []
    }

    const { username } = parsed
    const uris: Array<DiscoverUriEntry> = []

    // Shelf page: /user/{username}/(shelf|books)/{shelf-id}, so the shelf feed goes first.
    if (parsed.kind === 'shelf') {
      uris.push({
        uri: `${origin}/user/${username}/${parsed.section}/${parsed.shelf}/rss`,
        hint: composeHint('bookwyrm:shelf'),
      })
    }

    uris.push(
      {
        uri: `${origin}/user/${username}/rss`,
        hint: composeHint('bookwyrm:activity'),
      },
      {
        uri: `${origin}/user/${username}/rss-reviews`,
        hint: composeHint('bookwyrm:reviews'),
      },
      {
        uri: `${origin}/user/${username}/rss-quotes`,
        hint: composeHint('bookwyrm:quotes'),
      },
      {
        uri: `${origin}/user/${username}/rss-comments`,
        hint: composeHint('bookwyrm:comments'),
      },
    )

    return uris
  },
}
