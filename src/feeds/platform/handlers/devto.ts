import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isAnyOf, isHostOf } from '../../../common/utils.js'

const hosts = ['dev.to', 'www.dev.to']
const userPathRegex = /^\/([a-zA-Z0-9_]+)$/
const tagPathRegex = /^\/t\/([^/]+)/
const excludedPaths = [
  'tag',
  'tags',
  'search',
  'top',
  'latest',
  'about',
  'contact',
  'privacy',
  'terms',
  'code-of-conduct',
  'faq',
  'enter',
  'settings',
  'signout-confirm',
  'notifications',
  'reading-list',
  'dashboard',
]

export const devtoHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)

    // User profile: /username.
    const userMatch = pathname.match(userPathRegex)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!isAnyOf(username, excludedPaths)) {
        return [`https://dev.to/feed/${username}`]
      }
    }

    // Tag page: /t/tagname.
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [`https://dev.to/feed/tag/${tag}`]
    }

    return []
  },
}
