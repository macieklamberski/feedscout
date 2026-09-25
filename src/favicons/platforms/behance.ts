import { isAnyOf, isHostOf, isNonEmptyString, isPlainObject, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd } from '../../common/utils.js'
import { excludedPaths, hosts, userRegex } from '../../feeds/platforms/behance.js'

// Profile pages carry a JSON-LD Person whose `image` lists the same square avatar
// in several sizes, not sorted, topping out at 138 or 276 pixels depending on the account.
const getPersonImage = (content: string): string | undefined => {
  for (const data of getJsonLd(content)) {
    if (!isPlainObject(data) || data['@type'] !== 'Person' || !Array.isArray(data.image)) {
      continue
    }

    let largestUrl: string | undefined
    let largestWidth = 0

    for (const image of data.image) {
      const width = Number.parseInt(image?.width, 10)

      if (!isNonEmptyString(image?.url) || !(width > largestWidth)) {
        continue
      }

      largestUrl = image.url
      largestWidth = width
    }

    return largestUrl
  }
}

export const behanceHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    const match = parsedUrl.pathname.match(userRegex)

    if (!match?.[1]) {
      return false
    }

    return !isAnyOf(match[1], excludedPaths)
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const image = getPersonImage(content)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}
