import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  playlistRegex,
  userRegex,
} from '../../feeds/platforms/dailymotion.js'
import type { FaviconEnricher } from '../types.js'
import { parseBodyJson } from '../utils.js'

const platform = 'dailymotion'

// The id is the API path, `user/{name}` or `playlist/{id}`.
const getApiPath = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const playlistId = pathname.match(playlistRegex)?.[1]

  if (playlistId) {
    return `playlist/${playlistId}`
  }

  const username = pathname.match(userRegex)?.[1]

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return `user/${username}`
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

  try {
    const response = await context.fetchFn(`https://api.dailymotion.com/${ref.id}?fields=${field}`)
    const avatar = parseBodyJson(response.body)?.[field]

    // An account without an avatar gets the generic silhouette served under /d/.
    if (isNonEmptyString(avatar) && !parseUrl(avatar)?.pathname.startsWith('/d/')) {
      return [avatar]
    }
  } catch {}

  return []
}
