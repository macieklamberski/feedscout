import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  accountPathRegex,
  channelPathRegex,
  isPeertubeHeaders,
} from '../../../feeds/platform/handlers/peertube.js'

const avatarPathPrefix = '/lazy-static/avatars/'

const isProfilePath = (pathname: string): boolean => {
  return channelPathRegex.test(pathname) || accountPathRegex.test(pathname)
}

export const peertubeHandler: PlatformHandler = {
  match: (url, _content, headers) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !headers || !isPeertubeHeaders(headers)) {
      return false
    }

    return isProfilePath(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !content || !isProfilePath(parsedUrl.pathname)) {
      return []
    }

    const ogImage = getMetaContent(content, 'og:image')

    if (!ogImage || !parseUrl(ogImage)?.pathname.startsWith(avatarPathPrefix)) {
      return []
    }

    return [{ uri: ogImage }]
  },
}
