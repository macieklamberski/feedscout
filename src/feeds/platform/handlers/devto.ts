import { isAnyOf } from '../../../common/utils.js'
import type { PlatformHandler } from '../types.js'

const hosts = ['dev.to', 'www.dev.to']

const skipPaths = [
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
  match: (url) => isAnyOf(new URL(url).hostname, hosts),

  resolve: async (url) => {
    const { pathname } = new URL(url)

    // User profile: /username.
    const userMatch = pathname.match(/^\/([a-zA-Z0-9_]+)$/)

    if (userMatch?.[1]) {
      const username = userMatch[1]

      if (!skipPaths.includes(username.toLowerCase())) {
        return [`https://dev.to/feed/${username}`]
      }
    }

    // Tag page: /t/tagname.
    const tagMatch = pathname.match(/^\/t\/([^/]+)/)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [`https://dev.to/feed/tag/${tag}`]
    }

    return []
  },
}
