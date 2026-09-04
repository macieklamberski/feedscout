import { isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Zenn serves RSS 2.0 at `zenn.dev/feed` (trending), `zenn.dev/{user}/feed`,
// `zenn.dev/topics/{topic}/feed`, and `zenn.dev/p/{pub}/feed` for
// publications, and pages link to them via `<link rel="alternate">`. The
// handler normalises `/publications/{pub}` to the working `/p/{pub}/feed`
// shape, maps homepage requests to the trending feed, and excludes reserved
// top-level segments that aren't usernames.

const hosts = ['zenn.dev', 'www.zenn.dev']
const excludedPaths = [
  'about',
  'api',
  'articles',
  'books',
  'login',
  'notifications',
  'p',
  'privacy',
  'publications',
  'scraps',
  'search',
  'settings',
  'signup',
  'terms',
  'topics',
]
const topicRegex = /^\/topics\/([^/]+)/
const publicationShortRegex = /^\/p\/([^/]+)/
const publicationLongRegex = /^\/publications\/([^/]+)/

export const zennHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Topic page: /topics/{topic}
    const topicMatch = pathname.match(topicRegex)

    if (topicMatch?.[1]) {
      return [
        {
          uri: `https://zenn.dev/topics/${topicMatch[1]}/feed`,
          hint: composeHint('zenn:topic'),
        },
      ]
    }

    // Publication page: /p/{pub} or /publications/{pub}
    const pubMatch = pathname.match(publicationShortRegex) ?? pathname.match(publicationLongRegex)

    if (pubMatch?.[1]) {
      return [
        {
          uri: `https://zenn.dev/p/${pubMatch[1]}/feed`,
          hint: composeHint('zenn:publication'),
        },
      ]
    }

    const pathSegments = pathname.split('/').filter(Boolean)

    // Homepage: trending feed.
    if (pathSegments.length === 0) {
      return [
        {
          uri: 'https://zenn.dev/feed',
          hint: composeHint('zenn:trending'),
        },
      ]
    }

    const username = pathSegments[0]

    if (isAnyOf(username, excludedPaths)) {
      return []
    }

    return [
      {
        uri: `https://zenn.dev/${username}/feed`,
        hint: composeHint('zenn:posts'),
      },
    ]
  },
}
