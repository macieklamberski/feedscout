import type { PlatformHandler } from '../../../common/uris/platform/types.js'

const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length === 1 && segments[0].startsWith('@')
}

const isMastodonHtml = (html: string): boolean => {
  return /<meta[^>]+name=["']generator["'][^>]+content=["']Mastodon/i.test(html)
}

const isMastodonHeaders = (headers: Headers): boolean => {
  return /mastodon/i.test(headers.get('server') ?? '')
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

      return false
    } catch {
      return false
    }
  },

  resolve: async (url, _content, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { hostname, pathname } = new URL(url)
      const username = pathname.split('/').filter(Boolean)[0].replace('@', '')
      const apiUrl = `https://${hostname}/api/v1/accounts/lookup?acct=${username}`
      const response = await fetchFn(apiUrl)
      const data = JSON.parse(typeof response.body === 'string' ? response.body : '')

      if (typeof data.avatar === 'string' && data.avatar.length > 0) {
        return [{ uri: data.avatar }]
      }

      return []
    } catch {
      return []
    }
  },
}
