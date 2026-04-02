import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hasMetaContent } from '../../../common/utils.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

const mastodonRegex = /mastodon/i

// Extracts the username from the path, stripping the .rss feed extension
// that Mastodon appends to profile URLs (e.g., /@user.rss).
const profilePathRegex = /^\/@([^/.]+(?:@[^/.]+\.[^/.]+)?)(?:\.rss)?\/?$/

export const isProfilePath = (pathname: string): boolean => {
  return profilePathRegex.test(pathname)
}

export const isMastodonHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Mastodon')
}

export const isMastodonHeaders = (headers: Headers): boolean => {
  return mastodonRegex.test(headers.get('server') ?? '')
}

export const mastodonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    try {
      const { pathname } = new URL(url)

      if (!isProfilePath(pathname)) {
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

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { hostname, pathname } = new URL(url)
      const match = pathname.match(profilePathRegex)

      if (!match?.[1]) {
        return []
      }

      const username = match[1]
      const apiUrl = `https://${hostname}/api/v1/accounts/lookup?acct=${username}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)

      if (isNonEmptyString(data.avatar)) {
        return [{ uri: data.avatar }]
      }
    } catch {}

    return []
  },
}
