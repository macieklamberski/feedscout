import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Friendica instances expose per-user Atom feeds at
// `{instance}/feed/{nickname}` plus `comments`, `replies`, and `activity`
// variants, identified by `<meta name="generator" content="Friendica">` or
// the `x-friendica-version` response header.
// Profile pages link the posts feed via `<link rel="alternate">`, so
// generic discovery finds it; the handler is kept to emit the additional
// comments, replies, and activity variants that the HTML does not
// advertise.

const profileRegex = /^\/profile\/([^/]+)/

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const isFriendicaHeaders = (headers: Headers): boolean => {
  return headers.has('x-friendica-version')
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)

      if (!profileRegex.test(pathname)) {
        return false
      }

      if (content && isFriendicaHtml(content)) {
        return true
      }

      if (headers && isFriendicaHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1]) {
        return []
      }

      return [
        {
          uri: `${origin}/feed/${match[1]}`,
          hint: composeHint('friendica:posts'),
        },
        {
          uri: `${origin}/feed/${match[1]}/comments`,
          hint: composeHint('friendica:comments'),
        },
        {
          uri: `${origin}/feed/${match[1]}/replies`,
          hint: composeHint('friendica:replies'),
        },
        {
          uri: `${origin}/feed/${match[1]}/activity`,
          hint: composeHint('friendica:activity'),
        },
      ]
    } catch {}

    return []
  },
}
