import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { hosts, parseUserId } from '../../feeds/platforms/goodreads.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'goodreads'

const avatarRegex =
  /<img(?=[^>]*\sclass=["'](?:[^"']*\s)?profilePictureIcon[\s"'])[^>]*\ssrc=["']([^"']+)["']/i
// Avatars carry a size token before the file name, e.g. `1506617226p5/1.jpg`: p8 is the largest.
const sizeTokenRegex = /(\/\d+)p\d\//
const placeholderRegex = /\/nophoto\//

const getUserId = (url: string): string | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, action, segment] = getPathSegments(url)

  if (section !== 'user' || action !== 'show' || !segment) {
    return
  }

  return parseUserId(segment)?.toString()
}

// Users without a photo get a silhouette from s.gr-assets.com/assets/nophoto/.
const parseAvatar = (html: string): Array<string> => {
  const src = html.match(avatarRegex)?.[1] ?? getMetaContent(html, 'og:image')

  if (!src || placeholderRegex.test(src)) {
    return []
  }

  return [src.replace(sizeTokenRegex, '$1p8/')]
}

export const goodreadsHandler: PlatformHandler = {
  match: (url) => {
    return Boolean(getUserId(url))
  },

  resolve: (url, content) => {
    const id = getUserId(url)

    if (!id) {
      return []
    }

    if (!content) {
      return [{ platform, id, url }]
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
