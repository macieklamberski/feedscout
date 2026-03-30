import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'
import { isNonEmptyString, parseBodyJson } from '../../utils.js'

export const hosts = ['bsky.app', 'www.bsky.app']

export const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'profile'
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    try {
      return isHostOf(url, hosts) && isProfilePath(new URL(url).pathname)
    } catch {}

    return false
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    if (!fetchFn) {
      return []
    }

    try {
      const { pathname } = new URL(url)
      const segments = pathname.split('/').filter(Boolean)
      const handle = segments[1]
      const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${handle}`
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)

      if (isNonEmptyString(data.avatar)) {
        return [{ uri: data.avatar }]
      }
    } catch {}

    return []
  },
}
