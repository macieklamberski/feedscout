import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  channelRegex,
  customRegex,
  handleRegex,
  hosts,
  userRegex,
} from '../../../feeds/platform/handlers/youtube.js'

const ownerThumbnailRegex = /"videoOwnerRenderer":\{"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/
const thumbnailSizeRegex = /=s\d+-/

const isChannelPath = (pathname: string): boolean => {
  return [channelRegex, handleRegex, userRegex, customRegex].some((regex) => regex.test(pathname))
}

const isWatchUrl = (parsedUrl: URL): boolean => {
  return parsedUrl.pathname === '/watch' && parsedUrl.searchParams.has('v')
}

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    return isChannelPath(parsedUrl.pathname) || isWatchUrl(parsedUrl)
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !content) {
      return []
    }

    // A watch page's og:image is the video thumbnail, not the channel avatar.
    if (isWatchUrl(parsedUrl)) {
      const thumbnail = content.match(ownerThumbnailRegex)?.[1]

      if (!thumbnail) {
        return []
      }

      return [{ uri: thumbnail.replace(thumbnailSizeRegex, '=s900-') }]
    }

    if (!isChannelPath(parsedUrl.pathname)) {
      return []
    }

    const avatar = getMetaContent(content, 'og:image')

    if (!isNonEmptyString(avatar)) {
      return []
    }

    return [{ uri: avatar }]
  },
}
