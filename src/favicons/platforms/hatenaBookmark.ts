import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { isSuccessfulStatus } from '../../common/utils.js'
import { parseHatenaBookmarkUrl } from '../../feeds/platforms/hatenaBookmark.js'
import type { FaviconEnricher } from '../types.js'
import { createStatusError } from '../utils.js'

const platform = 'hatenaBookmark'

// The CDN redirects a user without an icon, or an unknown ID, to a generic image under this path.
const defaultImagePath = '/default_profile_images/'

export const hatenaBookmarkHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenaBookmarkUrl(url)?.kind === 'user'
  },

  resolve: (url) => {
    const parsed = parseHatenaBookmarkUrl(url)

    if (parsed?.kind !== 'user') {
      return []
    }

    return [{ platform, id: parsed.username, url }]
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
