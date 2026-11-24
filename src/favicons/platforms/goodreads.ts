import { goodreads } from 'feedintel'
import { getPathSegments, getQueryParam, includesAnyOf, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getMetaContent, hasClass } from '../../common/utils.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'goodreads'

export type GoodreadsUrl =
  | { kind: 'user'; userId: string }
  | { kind: 'reviews'; userId: string; shelf?: string }

const hosts = goodreads.hosts.exact

// A user page is /user/show/{id}-{slug} and their review list /review/list/{id}-{slug}.
export const parseGoodreadsUrl = (url: string): GoodreadsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [section, action, segment] = getPathSegments(url)
  const userId = Number.parseInt(segment ?? '', 10)

  if (!userId) {
    return
  }

  if (isAnyOf(section, 'user') && isAnyOf(action, 'show')) {
    return { kind: 'user', userId: String(userId) }
  }

  if (isAnyOf(section, 'review') && isAnyOf(action, 'list')) {
    const shelf = getQueryParam(parsedUrl.searchParams, 'shelf')

    return { kind: 'reviews', userId: String(userId), shelf }
  }
}

// Avatars carry a size token before the file name, e.g. `1506617226p5/1.jpg`: p8 is the largest.
const sizeTokenRegex = /(\/\d+)p\d\//i

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

  if (!src || includesAnyOf(src, '/nophoto/')) {
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
