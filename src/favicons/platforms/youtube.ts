import { isNonEmptyString } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { parseYoutubeUrl } from '../../feeds/platforms/youtube.js'

const ownerThumbnailRegex = /"videoOwnerRenderer":\{"thumbnail":\{"thumbnails":\[\{"url":"([^"]+)"/
const thumbnailSizeRegex = /=s\d+-/

// A short or player page carries no video owner block, and a playlist page shows no single channel.
const iconKinds = ['channel', 'watch']

export const youtubeHandler: PlatformHandler = {
  match: (url) => {
    const kind = parseYoutubeUrl(url)?.kind

    return kind !== undefined && iconKinds.includes(kind)
  },

  resolve: (url, content) => {
    const kind = parseYoutubeUrl(url)?.kind

    if (!content) {
      return []
    }

    // A watch page's og:image is the video thumbnail, not the channel avatar.
    if (kind === 'watch') {
      const thumbnail = content.match(ownerThumbnailRegex)?.[1]

      if (!thumbnail) {
        return []
      }

      return [{ uri: thumbnail.replace(thumbnailSizeRegex, '=s900-') }]
    }

    if (kind !== 'channel') {
      return []
    }

    const avatar = getMetaContent(content, 'og:image')

    if (!isNonEmptyString(avatar)) {
      return []
    }

    return [{ uri: avatar }]
  },
}
