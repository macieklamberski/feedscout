import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home, profile (guess, html).
// Handler needed for: hashtag, magazine, tagRedirect.

export const hosts = ['note.com', 'www.note.com']
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
// A hashtag page redirects to `/tag/{tag}`, and the feed stays under `/hashtag`.
const hashtagRegex = /^\/(?:hashtag|tag)\/([^/]+)/
export const magazineRegex = /^\/([^/]+)\/m\/([^/]+)/

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Hashtag page: /hashtag/{tag} or /tag/{tag}
    const hashtagMatch = pathname.match(hashtagRegex)

    if (hashtagMatch?.[1]) {
      return [
        {
          uri: `https://note.com/hashtag/${hashtagMatch[1]}/rss`,
          hint: composeHint('note:hashtag'),
        },
      ]
    }

    // Magazine page: /{user}/m/{magazineId}
    const magazineMatch = pathname.match(magazineRegex)

    if (magazineMatch?.[1] && magazineMatch?.[2]) {
      return [
        {
          uri: `https://note.com/${magazineMatch[1]}/m/${magazineMatch[2]}/rss`,
          hint: composeHint('note:magazine'),
        },
      ]
    }

    const pathSegments = pathname.split('/').filter(Boolean)

    if (pathSegments.length === 0) {
      return [
        {
          uri: 'https://note.com/rss',
          hint: composeHint('note:featured'),
        },
      ]
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://note.com/${username}/rss`,
        hint: composeHint('note:blog'),
      },
    ]
  },
}
