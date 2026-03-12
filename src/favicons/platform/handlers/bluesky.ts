import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['bsky.app', 'www.bsky.app']

const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'profile'
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    try {
      const { pathname } = new URL(url)

      return isHostOf(url, hosts) && isProfilePath(pathname)
    } catch {
      return false
    }
  },

  resolve: async (url, _content, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)
      const handle = segments[1]
      const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`
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
