import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/profile\/([^/]+)/i

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const isFriendicaHeaders = (headers: Headers): boolean => {
  return headers.has('x-friendica-version')
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!profileRegex.test(new URL(url).pathname)) {
      return false
    }

    return hasMarker(content, headers, { html: isFriendicaHtml, headers: isFriendicaHeaders })
  },

  resolve: (url) => {
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
  },
}
