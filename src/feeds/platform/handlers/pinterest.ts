import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Pinterest exposes per-user feeds at `www.pinterest.com/{user}/feed.rss` and
// per-board feeds at `www.pinterest.com/{user}/{board}.rss`, both returning
// `text/xml` RSS 2.0. The profile and board SPA pages do not advertise them via
// HTML `<link rel="alternate" type="application/rss+xml">` — only oembed JSON
// and app deep-links. The handler is needed to translate the `/{user}` and
// `/{user}/{board}` URL shapes onto the canonical `.rss` paths and to reject
// reserved sub-routes (`pins`, `_saved`, `_created`, `boards`, `followers`,
// `following`) as well as platform UI paths.

const hosts = ['pinterest.com', 'www.pinterest.com', 'pin.it']
const excludedPaths = [
  '_',
  'about',
  'business',
  'convert',
  'explore',
  'ideas',
  'login',
  'news_hub',
  'password',
  'pin',
  'privacy',
  'resource',
  'search',
  'settings',
  'terms',
  'today',
  'topics',
]

export const pinterestHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Need at least a username.
    if (pathSegments.length === 0) {
      return []
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    // Board page: /{user}/{board}. Reserved sub-routes (pins, _saved, etc.) are
    // not boards; fall through to the user feed.
    const reservedBoardSlugs = new Set([
      'pins',
      'boards',
      '_saved',
      '_created',
      'followers',
      'following',
    ])
    const board = pathSegments[1]

    if (board && !reservedBoardSlugs.has(board)) {
      return [
        {
          uri: `https://www.pinterest.com/${username}/${board}.rss`,
          hint: composeHint('pinterest:board'),
        },
      ]
    }

    return [
      {
        uri: `https://www.pinterest.com/${username}/feed.rss`,
        hint: composeHint('pinterest:pins'),
      },
    ]
  },
}
