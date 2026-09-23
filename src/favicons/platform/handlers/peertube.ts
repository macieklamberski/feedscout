import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  accountPathRegex,
  channelPathRegex,
  isPeertubeHeaders,
} from '../../../feeds/platform/handlers/peertube.js'
import { parseBodyJson } from '../../utils.js'

type Avatar = {
  width?: number
  path?: string
}

const avatarPathPrefix = '/lazy-static/avatars/'

const getApiUrl = (origin: string, pathname: string): string | undefined => {
  const channel = pathname.match(channelPathRegex)?.[1]

  if (channel) {
    return `${origin}/api/v1/video-channels/${channel}`
  }

  const account = pathname.match(accountPathRegex)?.[1]

  if (account) {
    return `${origin}/api/v1/accounts/${account}`
  }
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !headers || !isPeertubeHeaders(headers)) {
      return false
    }

    const { origin, pathname } = parsedUrl

    return Boolean(getApiUrl(origin, pathname))
  },

  resolve: async (url, content, _headers, fetchFn) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
    const apiUrl = getApiUrl(origin, pathname)

    if (!apiUrl) {
      return []
    }

    const ogImage = content ? getMetaContent(content, 'og:image') : undefined

    if (ogImage && parseUrl(ogImage)?.pathname.startsWith(avatarPathPrefix)) {
      return [{ uri: ogImage }]
    }

    if (!fetchFn) {
      return []
    }

    try {
      const response = await fetchFn(apiUrl)
      const data = parseBodyJson(response.body)
      const avatars: Array<Avatar> = Array.isArray(data?.avatars) ? data.avatars : []

      const largest = avatars
        .filter((avatar) => isNonEmptyString(avatar.path))
        .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]

      if (largest?.path) {
        return [{ uri: `${origin}${largest.path}` }]
      }
    } catch {}

    return []
  },
}
