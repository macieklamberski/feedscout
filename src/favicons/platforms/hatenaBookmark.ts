import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { isSuccessfulStatus } from '../../common/utils.js'
import { excludedPaths, hosts } from '../../feeds/platforms/hatenaBookmark.js'
import type { FaviconEnricher } from '../types.js'
import { createStatusError } from '../utils.js'

const platform = 'hatenaBookmark'

// A Hatena ID: 3 to 32 characters, starting with a letter and ending with a letter or digit.
const userRegex = /^\/([a-zA-Z][a-zA-Z0-9_-]{1,30}[a-zA-Z0-9])(?:\/|$)/

// The CDN redirects a user without an icon, or an unknown ID, to a generic image under this path.
const defaultImagePath = '/default_profile_images/'

const getUser = (pathname: string): string | undefined => {
  const match = pathname.match(userRegex)

  if (!match?.[1] || isAnyOf(match[1], excludedPaths)) {
    return
  }

  return match[1]
}

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return isHostOf(url, hosts) && !!getUser(parsedUrl.pathname)
  },

  resolve: (url) => {
    const user = getUser(new URL(url).pathname)

    if (!user) {
      return []
    }

    return [{ platform, id: user, url }]
  },
}

// The avatar address looks the same for every ID, so only the redirect a HEAD request follows
// tells a real icon from the default one.
export const hatenaBookmarkEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const avatarUrl = `https://cdn.profile-image.st-hatena.com/users/${ref.id}/profile_256x256.png`
  const response = await context.fetchFn(avatarUrl, { method: 'HEAD' })

  if (response.status === 404 || response.url.includes(defaultImagePath)) {
    return []
  }

  if (!isSuccessfulStatus(response.status)) {
    throw createStatusError(response)
  }

  return [avatarUrl]
}
