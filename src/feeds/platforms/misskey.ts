import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasAnyMeta, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type MisskeyUrl = { kind: 'profile'; username: string }

const profileRegex = /^\/@([^/.]+)/
const metaMarkers: Array<[string, string]> = [
  ['application-name', 'Misskey'],
  ['application-name', 'Sharkey'], // Fork, same feed routes
]

export const isMisskeyHtml = (content: string): boolean => {
  return hasElementWithId(content, 'misskey_meta') || hasAnyMeta(content, metaMarkers)
}

export const parseMisskeyUrl = (url: string): MisskeyUrl | undefined => {
  const username = parseUrl(url)?.pathname.match(profileRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const misskeyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isMisskeyHtml })) {
      return false
    }

    return parseMisskeyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMisskeyUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/@${parsed.username}.atom`,
        hint: composeHint('misskey:posts', 'atom'),
      },
      {
        uri: `${origin}/@${parsed.username}.rss`,
        hint: composeHint('misskey:posts', 'rss'),
      },
      {
        uri: `${origin}/@${parsed.username}.json`,
        hint: composeHint('misskey:posts', 'json'),
      },
    ]
  },
}
