import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FriendicaUrl = { kind: 'profile'; username: string }

const profileRegex = /^\/profile\/([^/]+)/i

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const isFriendicaHeaders = (headers: Headers): boolean => {
  return headers.has('x-friendica-version')
}

export const parseFriendicaUrl = (url: string): FriendicaUrl | undefined => {
  const username = new URL(url).pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseFriendicaUrl(url) === undefined) {
      return false
    }

    return hasMarker(content, headers, { html: isFriendicaHtml, headers: isFriendicaHeaders })
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseFriendicaUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `${origin}/feed/${parsed.username}`,
        hint: composeHint('friendica:posts'),
      },
      {
        uri: `${origin}/feed/${parsed.username}/comments`,
        hint: composeHint('friendica:comments'),
      },
      {
        uri: `${origin}/feed/${parsed.username}/replies`,
        hint: composeHint('friendica:replies'),
      },
      {
        uri: `${origin}/feed/${parsed.username}/activity`,
        hint: composeHint('friendica:activity'),
      },
    ]
  },
}
