import { isHostOf, isNonEmptyString, isPlainObject, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { curatorPathRegex, hosts } from '../../../feeds/platform/handlers/togetter.js'

const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
const twitterSizeRegex = /_normal(\.\w+)$/

// The ProfilePage avatar is the user's X avatar at 48 by 48 pixels, and X serves the same image at
// 400 by 400 when the `_normal` suffix is swapped.
const getProfileImage = (content: string): string | undefined => {
  for (const match of content.matchAll(jsonLdRegex)) {
    try {
      const items = [JSON.parse(match[1] ?? '')].flat()

      for (const item of items) {
        if (!isPlainObject(item) || item['@type'] !== 'ProfilePage') {
          continue
        }

        const entity = item.mainEntity

        if (isPlainObject(entity) && isNonEmptyString(entity.image)) {
          return entity.image.replace(twitterSizeRegex, '_400x400$1')
        }
      }
    } catch {}
  }
}

export const togetterHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && curatorPathRegex.test(parsedUrl.pathname)
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
