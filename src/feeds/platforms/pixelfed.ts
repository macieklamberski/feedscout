import { isAnyOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasAnyMeta } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PixelfedUrl = { kind: 'user'; username: string }

const profileRegex = /^\/(?:users\/)?([a-zA-Z0-9_]+)\/?$/
const metaMarkers: Array<[string, string]> = [
  ['generator', 'pixelfed'],
  ['application-name', 'Pixelfed'],
]
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
  return hasAnyMeta(content, metaMarkers)
}

export const parsePixelfedUrl = (url: string): PixelfedUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const pixelfedHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isPixelfedHtml(content)) {
      return false
    }

    return parsePixelfedUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const username = parsePixelfedUrl(url)?.username

    if (!username) {
      return []
    }

    return [
      {
        uri: `${origin}/users/${username}.atom`,
        hint: composeHint('pixelfed:posts'),
      },
    ]
  },
}
