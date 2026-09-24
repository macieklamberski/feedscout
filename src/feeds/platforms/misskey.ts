import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasAnyMeta } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const profileRegex = /^\/@([^/.]+)/
const metaMarkers: Array<[string, string]> = [
  ['application-name', 'Misskey'],
  ['application-name', 'Sharkey'], // Fork, same feed routes
]

export const isMisskeyHtml = (content: string): boolean => {
  return content.includes('id="misskey_meta"') || hasAnyMeta(content, metaMarkers)
}

export const misskeyHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isMisskeyHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    return profileRegex.test(pathname)
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
    const match = pathname.match(profileRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `${origin}/@${match[1]}.atom`,
        hint: composeHint('misskey:posts', 'atom'),
      },
      {
        uri: `${origin}/@${match[1]}.rss`,
        hint: composeHint('misskey:posts', 'rss'),
      },
      {
        uri: `${origin}/@${match[1]}.json`,
        hint: composeHint('misskey:posts', 'json'),
      },
    ]
  },
}
