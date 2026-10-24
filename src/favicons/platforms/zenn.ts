import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { parseZennUrl, type ZennUrl } from '../../feeds/platforms/zenn.js'

// Zenn serves its own logo for a missing profile or publication and a generic topic.png for a
// topic without an image, both under /images/. Uploaded icons live under /user-upload/.
const placeholderPathRegex = /^\/images\//i

// Article and book pages carry a wide generated card, so only the entity pages themselves match.
const handledKinds: Array<ZennUrl['kind']> = ['user', 'topic', 'publication']

export const zennHandler: PlatformHandler = {
  match: (url) => {
    const parsed = parseZennUrl(url)

    if (!parsed) {
      return false
    }

    return handledKinds.includes(parsed.kind)
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const image = getMetaContent(content, 'og:image')

    if (!isNonEmptyString(image)) {
      return []
    }

    const parsedImage = parseUrl(image)

    if (!parsedImage || placeholderPathRegex.test(parsedImage.pathname)) {
      return []
    }

    return [{ uri: image }]
  },
}
