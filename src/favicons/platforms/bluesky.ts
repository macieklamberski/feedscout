import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'bluesky'

export const hosts = ['bsky.app', 'www.bsky.app']

export const isProfilePath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  return segments.length >= 2 && segments[0] === 'profile'
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isProfilePath(parsedUrl.pathname) && isHostOf(url, hosts)
  },

  resolve: (url) => {
    const handle = parseUrl(url)?.pathname.split('/').filter(Boolean)[1]

    if (!handle) {
      return []
    }

    return [{ platform, id: handle, url }]
  },
}

export const blueskyEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  try {
    const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${ref.id}`
    const response = await context.fetchFn(apiUrl)
    const data = parseBodyJson(response.body)

    if (isNonEmptyString(data.avatar)) {
      return [data.avatar]
    }
  } catch {}

  return []
}
