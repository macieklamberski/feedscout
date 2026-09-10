import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Pixelfed exposes a single Atom feed per profile at
// `{instance}/users/{user}.atom`, served by `ProfileController@showAtomFeed` —
// the only feed route registered in `routes/web.php`. There are no RSS, tag,
// discover, public-timeline, or per-status feed routes upstream. The handler is
// content-keyed by the `<meta name="generator" content="pixelfed">` tag
// (instances are not enumerable by host) and maps both `/{user}` and
// `/users/{user}` profile URLs onto the canonical `.atom` path.

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
