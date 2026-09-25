import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { parseDailymotionUrl } from '../../feeds/platforms/dailymotion.js'
import type { FaviconEnricher } from '../types.js'
import { parseResponseJson } from '../utils.js'

const platform = 'dailymotion'

// The id is the API path, `user/{name}` or `playlist/{id}`.
const getApiPath = (url: string): string | undefined => {
  const parsed = parseDailymotionUrl(url)

  if (parsed?.kind === 'playlist') {
    return `playlist/${parsed.playlistId}`
  }

  if (parsed?.kind === 'user') {
    return `user/${parsed.username}`
  }
}

export const dailymotionHandler: PlatformHandler = {
  match: (url) => {
    return getApiPath(url) !== undefined
  },

  resolve: (url) => {
    const id = getApiPath(url)

    if (!id) {
      return []
    }

    return [{ platform, id, url }]
  },
}

export const dailymotionEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const field = ref.id.startsWith('playlist/') ? 'owner.avatar_720_url' : 'avatar_720_url'

  const response = await context.fetchFn(`https://api.dailymotion.com/${ref.id}?fields=${field}`)
  const avatar = parseResponseJson(response)?.[field]

  // An account without an avatar gets the generic silhouette served under /d/.
  if (isNonEmptyString(avatar) && !parseUrl(avatar)?.pathname.startsWith('/d/')) {
    return [avatar]
  }

  return []
}
