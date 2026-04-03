import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'
import { isMastodonHeaders, isMastodonHtml } from '../../../favicons/platform/handlers/mastodon.js'

const profilePattern = /^\/@([^/]+)/
const tagPattern = /^\/tags\/([^/]+)/

export const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length > 0 && segments[0].startsWith('@')
}

export const isTagPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'tags'
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)

      if (!isProfilePath(pathname) && !isTagPath(pathname)) {
        return false
      }

      if (content && isMastodonHtml(content)) {
        return true
      }

      if (headers && isMastodonHeaders(headers)) {
        return true
      }
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const userMatch = pathname.match(profilePattern)

      if (userMatch?.[1]) {
        return [{ uri: `${origin}/@${userMatch[1]}.rss`, hint: composeHint('mastodon:posts') }]
      }

      const tagMatch = pathname.match(tagPattern)

      if (tagMatch?.[1]) {
        return [{ uri: `${origin}/tags/${tagMatch[1]}.rss`, hint: composeHint('mastodon:tag') }]
      }
    } catch {}

    return []
  },
}
