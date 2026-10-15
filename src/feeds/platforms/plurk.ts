import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers post, user, userPath (guess, html).
// Handler needed for: mobile, mobilePost.

export type PlurkUrl =
  | { kind: 'post'; postId: string }
  | { kind: 'user'; username: string }
  | { kind: 'page' }

const hosts = ['plurk.com', 'www.plurk.com']

// A root `.xml` path is a user's feed, so a guessed /feed.xml is the feed of a user named feed.
const userFeedRegex = /^https?:\/\/(?:www\.)?plurk\.com\/[^/]+\.xml$/i

// A page that names no post or user still parses, so `match` stays true on every Plurk page and
// the guess exclusion applies there.
export const parsePlurkUrl = (url: string): PlurkUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const segments = getPathSegments(url)
  const isMobile = isAnyOf(segments[0], 'm')
  const [route, value] = isMobile ? segments.slice(1) : segments

  if (isAnyOf(route, 'p')) {
    if (!value) {
      return { kind: 'page' }
    }

    return { kind: 'post', postId: value }
  }

  const username = isAnyOf(route, 'u') ? value : route

  if (!username) {
    return { kind: 'page' }
  }

  return { kind: 'user', username }
}

export const plurkHandler: PlatformHandler = {
  match: (url) => {
    return parsePlurkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePlurkUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'post') {
      return [
        {
          uri: `https://www.plurk.com/p/${parsed.postId}.xml`,
          hint: composeHint('plurk:responses'),
        },
      ]
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `https://www.plurk.com/${parsed.username}.xml`,
          hint: composeHint('plurk:plurks'),
        },
      ]
    }

    return []
  },

  guessExclusionRegex: userFeedRegex,
}
