import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

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

    if (pathSegments.length === 0) {
      return []
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
