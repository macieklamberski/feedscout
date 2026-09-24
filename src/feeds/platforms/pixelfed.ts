import { isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasAnyMeta } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export const profileRegex = /^\/(?:users\/)?([a-zA-Z0-9_]+)\/?$/
const metaMarkers: Array<[string, string]> = [
  ['generator', 'pixelfed'],
  ['application-name', 'Pixelfed'],
]
export const excludedPaths = [
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
  return hasAnyMeta(content, metaMarkers)
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isPixelfedHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl
    const match = pathname.match(profileRegex)

    return Boolean(match?.[1] && !isAnyOf(match[1], excludedPaths))
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
    const match = pathname.match(profileRegex)

    if (!match?.[1] || isAnyOf(match[1], excludedPaths)) {
      return []
    }

    return [
      {
        uri: `${origin}/users/${match[1]}.atom`,
        hint: composeHint('pixelfed:posts'),
      },
    ]
  },
}
