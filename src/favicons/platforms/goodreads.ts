import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getMetaContent, hasClass } from '../../common/utils.js'
import { parseGoodreadsUrl } from '../../feeds/platforms/goodreads.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

// Avatars carry a size token before the file name, e.g. `1506617226p5/1.jpg`: p8 is the largest.
const sizeTokenRegex = /(\/\d+)p\d\//
const placeholderRegex = /\/nophoto\//

const platform = 'goodreads'

// Users without a photo get a silhouette from s.gr-assets.com/assets/nophoto/.
const parseAvatar = (html: string): Array<string> => {
  const avatar = findElement(html, (element) => {
    return (
      element.name === 'img' &&
      hasClass(element, 'profilePictureIcon') &&
      Boolean(element.attribs.src)
    )
  })
  const src = avatar?.attribs.src ?? getMetaContent(html, 'og:image')

  if (!src || placeholderRegex.test(src)) {
    return []
  }

  return [src.replace(sizeTokenRegex, '$1p8/')]
}

export const goodreadsHandler: PlatformHandler = {
  // A review list redirects clients that are not signed in to the sign-in page, which carries
  // no avatar.
  match: (url) => {
    return parseGoodreadsUrl(url)?.kind === 'user'
  },

  resolve: (url, content) => {
    const parsed = parseGoodreadsUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    if (!content) {
      return [{ platform, id: parsed.userId, url }]
    }

    return parseAvatar(content).map((uri) => ({ uri }))
  },
}

export const goodreadsEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://www.goodreads.com/user/show/${ref.id}`)

  return parseAvatar(getResponseText(response))
}
