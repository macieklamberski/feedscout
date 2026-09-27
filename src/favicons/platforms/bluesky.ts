import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseBlueskyUrl } from '../../feeds/platforms/bluesky.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'bluesky'

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return parseBlueskyUrl(url) !== undefined
  },

  resolve: (url) => {
    const handle = parseBlueskyUrl(url)?.handle

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

  const apiUrl = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${ref.id}`
  const response = await context.fetchFn(apiUrl)
  const data = parseResponseJson(response)

  if (isNonEmptyString(data.avatar)) {
    return [data.avatar]
  }

  return []
}
