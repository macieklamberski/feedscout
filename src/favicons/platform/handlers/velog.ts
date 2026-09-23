import { isHostOf, isNonEmptyString, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts, userRegex } from '../../../feeds/platform/handlers/velog.js'

const profileImageRegex = /<img(?=[^>]*\balt=["']profile["'])[^>]*\bsrc=["']([^"']+)["']/i

// Velog shows this image for every user who has not uploaded an avatar.
const placeholderRegex = /\/images\/user-thumbnail\.png$/

const isUserUrl = (url: string): boolean => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return false
  }

  return isHostOf(url, hosts) && userRegex.test(parsedUrl.pathname)
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return isUserUrl(url)
  },

  resolve: (url, content) => {
    if (!isUserUrl(url)) {
      return []
    }

    const pageImage = content?.match(profileImageRegex)?.[1]

    if (!isNonEmptyString(pageImage) || placeholderRegex.test(pageImage)) {
      return []
    }

    return [{ uri: pageImage }]
  },
}
