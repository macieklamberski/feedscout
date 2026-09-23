import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isBookwyrmHtml } from '../../../feeds/platform/handlers/bookwyrm.js'

const profileRegex = /^\/user\/[^/]+\/?$/
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

    return profileRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !profileRegex.test(parsedUrl.pathname)) {
      return []
    }

    const avatarSrc = content?.match(avatarRegex)?.[1]

    if (!avatarSrc || defaultAvatarRegex.test(avatarSrc)) {
      return []
    }

    const avatarUrl = parseUrl(avatarSrc, parsedUrl)

    if (!avatarUrl) {
      return []
    }

    return [{ uri: avatarUrl.href }]
  },
}
