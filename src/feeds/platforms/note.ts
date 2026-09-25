import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html).
// Handler needed for: hashtag, magazine, tagRedirect.

export type NoteUrl =
  | { kind: 'hashtag'; tag: string }
  | { kind: 'magazine'; username: string; magazine: string }
  | { kind: 'user'; username: string }

export const hosts = ['note.com', 'www.note.com']

// A hashtag page redirects to `/tag/{tag}`, and the feed stays under `/hashtag`.
const hashtagRegex = /^\/(?:hashtag|tag)\/([^/]+)/
const magazineRegex = /^\/([^/]+)\/m\/([^/]+)/

export const excludedPaths = [
  'about',
  'api',
  'explore',
  'hashtag',
  'help',
  'login',
  'm',
  'n',
  'premium',
  'privacy',
  'ranking',
  'search',
  'tag',
  'settings',
  'signup',
  'terms',
]

export const parseNoteUrl = (url: string): NoteUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const tag = pathname.match(hashtagRegex)?.[1]

  if (tag) {
    return { kind: 'hashtag', tag }
  }

  const magazineMatch = pathname.match(magazineRegex)

  if (magazineMatch?.[1] && magazineMatch[2]) {
    return { kind: 'magazine', username: magazineMatch[1], magazine: magazineMatch[2] }
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const parsed = parseNoteUrl(url)

    if (parsed?.kind === 'hashtag') {
      return [
        {
          uri: `https://note.com/hashtag/${parsed.tag}/rss`,
          hint: composeHint('note:hashtag'),
        },
      ]
    }

    if (parsed?.kind === 'magazine') {
      return [
        {
          uri: `https://note.com/${parsed.username}/m/${parsed.magazine}/rss`,
          hint: composeHint('note:magazine'),
        },
      ]
    }

    if (parsed?.kind === 'user') {
      return [
        {
          uri: `https://note.com/${parsed.username}/rss`,
          hint: composeHint('note:blog'),
        },
      ]
    }

    if (getPathSegments(url).length === 0) {
      return [
        {
          uri: 'https://note.com/rss',
          hint: composeHint('note:featured'),
        },
      ]
    }

    return []
  },
}
