import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['qiita.com', 'www.qiita.com']
const excludedPaths = [
  'about',
  'api',
  'login',
  'organizations',
  'popular-items',
  'privacy',
  'search',
  'settings',
  'signup',
  'tags',
  'terms',
  'trend',
]
const tagRegex = /^\/tags\/([^/]+)/
const organizationRegex = /^\/organizations\/([^/]+)/
const popularItemsRegex = /^\/popular-items(\/|$)/

export const qiitaHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // Tag page: /tags/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `https://qiita.com/tags/${tagMatch[1]}/feed.atom`,
          hint: composeHint('qiita:tag'),
        },
      ]
    }

    // Organization page: /organizations/{org}
    const orgMatch = pathname.match(organizationRegex)

    if (orgMatch?.[1]) {
      return [
        {
          uri: `https://qiita.com/organizations/${orgMatch[1]}/activities.atom`,
          hint: composeHint('qiita:organization'),
        },
      ]
    }

    // Popular items page
    if (popularItemsRegex.test(pathname)) {
      return [
        {
          uri: 'https://qiita.com/popular-items/feed.atom',
          hint: composeHint('qiita:popular'),
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
        uri: `https://qiita.com/${username}/feed.atom`,
        hint: composeHint('qiita:posts'),
      },
    ]
  },
}
