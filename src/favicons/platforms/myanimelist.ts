import { getPathSegments } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasClass } from '../../common/utils.js'
import { parseMyanimelistUrl } from '../../feeds/platforms/myanimelist.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'myanimelist'

const userImageRegex = /^https:\/\/cdn\.myanimelist\.net\/s\/common\/userimages\//

// A user without an avatar gets a "No Picture" block and no image.
const parseAvatar = (html: string): Array<string> => {
  const avatar = findElement(html, (element) => {
    return (
      element.name === 'img' &&
      Boolean(element.attribs['data-src']) &&
      hasClass(element.parent, 'user-image')
    )
  })
  const src = avatar?.attribs['data-src']

  if (!src || !userImageRegex.test(src)) {
    return []
  }

  return [src]
}

export const myanimelistHandler: PlatformHandler = {
  match: (url) => {
    return parseMyanimelistUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const username = parseMyanimelistUrl(url)?.username

    if (!username) {
      return []
    }

    const [section, ...rest] = getPathSegments(url)

    // List and history pages carry no avatar, while the user's profile page does.
    if (!content || section !== 'profile' || rest.length !== 1) {
      return [{ platform, id: username, url }]
    }

    return parseAvatar(content).map((uri) => ({ uri }))
  },
}

export const myanimelistEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://myanimelist.net/profile/${ref.id}`)

  return parseAvatar(getResponseText(response))
}
