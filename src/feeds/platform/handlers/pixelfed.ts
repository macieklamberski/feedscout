import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/(?:users\/)?([a-zA-Z0-9_]+)\/?$/
const excludedPaths = [
  'admin',
  'api',
  'discover',
  'i',
  'login',
  'notifications',
  'p',
  'register',
  'settings',
  'site',
  'storage',
  'timeline',
  'users',
]

export const isPixelfedHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'pixelfed')
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isPixelfedHtml(content)) {
        return false
      }

      const { pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      return Boolean(match?.[1] && !excludedPaths.includes(match[1]))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1] || excludedPaths.includes(match[1])) {
        return []
      }

      return [
        {
          uri: `${origin}/users/${match[1]}.atom`,
          hint: composeHint('pixelfed:posts'),
        },
      ]
    } catch {}

    return []
  },
}
