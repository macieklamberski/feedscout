import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Qiita exposes Atom feeds for user posts (`/{user}/feed.atom`), tags
// (`/tags/{tag}/feed.atom`), organizations
// (`/organizations/{org}/activities.atom`), and popular items
// (`/popular-items/feed.atom`), plus an RSS 2.0 feed for Qiita Zine at
// `/official-columns/feed/`. The handler maps the matching browser URL
// shapes onto these feeds and excludes reserved path segments so user
// fallback does not produce 404-bound URIs for system pages.

const hosts = ['qiita.com', 'www.qiita.com']
const excludedPaths = [
  'about',
  'api',
  'login',
  'official-columns',
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
const officialColumnsRegex = /^\/official-columns(\/|$)/

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

    // Qiita Zine (official columns).
    if (officialColumnsRegex.test(pathname)) {
      return [
        {
          uri: 'https://qiita.com/official-columns/feed/',
          hint: composeHint('qiita:zine'),
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
