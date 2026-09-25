import { isNonEmptyString, isPlainObject } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd } from '../../common/utils.js'
import { parseTogetterUrl } from '../../feeds/platforms/togetter.js'

const twitterSizeRegex = /_normal(\.\w+)$/

// The ProfilePage avatar is the user's X avatar at 48 by 48 pixels, and X serves the same image at
// 400 by 400 when the `_normal` suffix is swapped.
const getProfileImage = (content: string): string | undefined => {
  for (const item of getJsonLd(content).flat()) {
    if (!isPlainObject(item) || item['@type'] !== 'ProfilePage') {
      continue
    }

    const entity = item.mainEntity

    if (isPlainObject(entity) && isNonEmptyString(entity.image)) {
      return entity.image.replace(twitterSizeRegex, '_400x400$1')
    }
  }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    return parseTogetterUrl(url) !== undefined
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const image = getProfileImage(content)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}
