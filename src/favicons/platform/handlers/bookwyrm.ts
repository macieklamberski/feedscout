import { isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isBookwyrmHtml } from '../../../feeds/platform/handlers/bookwyrm.js'
import { parseBodyJson } from '../../utils.js'

// Profile page, the all-books page, and a single shelf.
const pageRegex = /^\/user\/([^/]+)(?:\/(?:shelf|books)(?:\/[^/]+)?)?\/?$/
const avatarRegex = /<img(?=[^>]*\bclass=["'][^"']*\bavatar\b)[^>]*\bsrc=["']([^"']+)["']/i
// Served in place of an avatar to users who never uploaded one.
const defaultAvatarRegex = /\/images\/default_avi\.jpg$/

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isBookwyrmHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return pageRegex.test(parsedUrl.pathname)
  },

  resolve: async (url, content, _headers, fetchFn) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(pageRegex)

      if (!match?.[1]) {
        return []
      }

      // Shelf pages carry no avatar, so they fall through to the actor JSON.
      const avatarSrc = content?.match(avatarRegex)?.[1]

      if (avatarSrc && defaultAvatarRegex.test(avatarSrc)) {
        return []
      }

      if (avatarSrc) {
        return [{ uri: new URL(avatarSrc, url).href }]
      }

      if (!fetchFn) {
        return []
      }

      const response = await fetchFn(`${origin}/user/${match[1]}.json`)
      const data = parseBodyJson(response.body)
      const iconUrl = data?.icon?.url

      if (isNonEmptyString(iconUrl) && !defaultAvatarRegex.test(iconUrl)) {
        return [{ uri: iconUrl }]
      }
    } catch {}

    return []
  },
}
