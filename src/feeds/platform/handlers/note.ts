import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// note.com serves per-creator (`/{user}/rss`), per-hashtag (`/hashtag/{tag}/rss`),
// per-magazine (`/{user}/m/{magId}/rss`), and site-wide spotlight (`/rss`) feeds
// as RSS 2.0. Only the per-creator page exposes an HTML `<link rel="alternate">`;
// hashtag, magazine, article, and the root page are SPA-hydrated with no static
// autodiscovery link. The handler maps each human-facing URL shape onto its
// corresponding `*/rss` path and gates a long `excludedPaths` list to keep
// platform routes (api, search, settings, etc.) from being treated as usernames.

const hosts = ['note.com', 'www.note.com']
const excludedPaths = [
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
  'settings',
  'signup',
  'terms',
]
const hashtagRegex = /^\/hashtag\/([^/]+)/
const magazineRegex = /^\/([^/]+)\/m\/([^/]+)/

export const noteHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Hashtag page: /hashtag/{tag}
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
