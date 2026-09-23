import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import {
  excludedPaths,
  hosts,
  playlistRegex,
  userRegex,
} from '../../../feeds/platform/handlers/dailymotion.js'
import { parseBodyJson } from '../../utils.js'

type AvatarSource = {
  apiUrl: string
  field: string
}

const getAvatarSource = (url: string): AvatarSource | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const playlistMatch = pathname.match(playlistRegex)

  if (playlistMatch?.[1]) {
    return {
      apiUrl: `https://api.dailymotion.com/playlist/${playlistMatch[1]}?fields=owner.avatar_720_url`,
      field: 'owner.avatar_720_url',
    }
  }

  const userMatch = pathname.match(userRegex)

  if (!userMatch?.[1] || isAnyOf(userMatch[1], excludedPaths)) {
    return
  }

  return {
    apiUrl: `https://api.dailymotion.com/user/${userMatch[1]}?fields=avatar_720_url`,
    field: 'avatar_720_url',
  }
}

export const dailymotionHandler: PlatformHandler = {
  match: (url) => {
    return !!getAvatarSource(url)
  },

  resolve: async (url, _content, _headers, fetchFn) => {
    const source = getAvatarSource(url)

    if (!fetchFn || !source) {
      return []
    }

    try {
      const response = await fetchFn(source.apiUrl)
      const avatar = parseBodyJson(response.body)?.[source.field]

      // An account without an avatar gets the generic silhouette served under /d/.
      if (!isNonEmptyString(avatar) || parseUrl(avatar)?.pathname.startsWith('/d/')) {
        return []
      }

      return [{ uri: avatar }]
    } catch {}

    return []
  },
}
