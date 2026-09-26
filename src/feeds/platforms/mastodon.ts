import { isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasElementWithId, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers profile, users (guess, html).
// Handler needed for: tag.

export type MastodonUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'replies'; username: string }
  | { kind: 'media'; username: string }
  | { kind: 'tagged'; username: string; tag: string }
  | { kind: 'tag'; tag: string }

const mastodonRegex = /mastodon/i
// A profile URL can end in .rss, a legacy .atom or the ActivityPub .json. Names carry no dots.
const feedExtensionRegex = /\.(rss|atom|json)$/i

// Current Mastodon serves no generator meta, so the `<div id="mastodon">` app
// root is matched too.
export const isMastodonHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Mastodon') || hasElementWithId(content, 'mastodon')
}

export const isMastodonHeaders = (headers: Headers): boolean => {
  return mastodonRegex.test(headers.get('server') ?? '')
}

export const parseMastodonUrl = (url: string): MastodonUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Mastodon serves a page's feed at the page path plus .rss, as in /@user.rss.
  const segments = parsedUrl.pathname.split('/').filter(Boolean)
  const [first, second, third] = segments.map((segment) => segment.replace(feedExtensionRegex, ''))

  if (isAnyOf(first, 'tags') && second) {
    return { kind: 'tag', tag: second }
  }

  // Mastodon serves the profile at /users/{user} too, without redirecting, unless HTML is
  // asked for.
  if (isAnyOf(first, 'users') && second) {
    return { kind: 'profile', username: second }
  }

  if (!first?.startsWith('@')) {
    return
  }

  const username = first.slice(1)

  if (!username) {
    return
  }

  if (isAnyOf(second, 'with_replies')) {
    return { kind: 'replies', username }
  }

  if (isAnyOf(second, 'media')) {
    return { kind: 'media', username }
  }

  if (isAnyOf(second, 'tagged') && third) {
    return { kind: 'tagged', username, tag: third }
  }

  return { kind: 'profile', username }
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!parseMastodonUrl(url)) {
      return false
    }

    if (content && isMastodonHtml(content)) {
      return true
    }

    if (headers && isMastodonHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseMastodonUrl(url)

    if (parsed?.kind === 'replies') {
      return [
        {
          uri: `${origin}/@${parsed.username}/with_replies.rss`,
          hint: composeHint('mastodon:replies'),
        },
        {
          uri: `${origin}/@${parsed.username}.rss`,
          hint: composeHint('mastodon:posts'),
        },
      ]
    }

    if (parsed?.kind === 'media') {
      return [
        {
          uri: `${origin}/@${parsed.username}/media.rss`,
          hint: composeHint('mastodon:media'),
        },
        {
          uri: `${origin}/@${parsed.username}.rss`,
          hint: composeHint('mastodon:posts'),
        },
      ]
    }

    if (parsed?.kind === 'tagged') {
      return [
        {
          uri: `${origin}/@${parsed.username}/tagged/${parsed.tag}.rss`,
          hint: composeHint('mastodon:tagged'),
        },
        {
          uri: `${origin}/@${parsed.username}.rss`,
          hint: composeHint('mastodon:posts'),
        },
      ]
    }

    if (parsed?.kind === 'profile') {
      return [{ uri: `${origin}/@${parsed.username}.rss`, hint: composeHint('mastodon:posts') }]
    }

    if (parsed?.kind === 'tag') {
      return [{ uri: `${origin}/tags/${parsed.tag}.rss`, hint: composeHint('mastodon:tag') }]
    }

    return []
  },
}
