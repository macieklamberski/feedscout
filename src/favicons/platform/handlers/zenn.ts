import { isAnyOf, isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import {
  excludedPaths,
  hosts,
  publicationLongRegex,
  publicationShortRegex,
  topicRegex,
} from '../../../feeds/platform/handlers/zenn.js'

// Zenn serves its own logo for a missing profile or publication and a generic topic.png for a
// topic without an image, both under /images/. Uploaded icons live under /user-upload/.
const placeholderPathRegex = /^\/images\//

// Article and book pages carry a wide generated card, so only the entity pages themselves match.
const isEntityPath = (pathname: string): boolean => {
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 1) {
    return !isAnyOf(segments[0], excludedPaths)
  }

  if (segments.length === 2) {
    return (
      topicRegex.test(pathname) ||
      publicationShortRegex.test(pathname) ||
      publicationLongRegex.test(pathname)
    )
  }

  return false
}

export const zennHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    return isEntityPath(parsedUrl.pathname)
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
